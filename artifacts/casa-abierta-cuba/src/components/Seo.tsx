import { useEffect } from 'react';
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME } from '@/lib/site';

interface SeoProps {
  /** Título social de la página (el <title> lo fija cada página con document.title). */
  title: string;
  description: string;
  /** Ruta interna canónica, siempre relativa al dominio oficial. */
  path: string;
  /** Foto principal de la página (relativa o absoluta). */
  image?: string | null;
  /** og:type: 'website' por defecto; 'article' para fichas con más contexto. */
  type?: string;
  /** Datos estructurados JSON-LD que se inyectan en <head>. */
  jsonLd?: Record<string, unknown> | null;
}

type Restaurable = { el: Element; previo: string | null; creado: boolean };

/** Crea o actualiza un <meta>, recordando su valor anterior para restaurarlo. */
function escribirMeta(
  attr: 'name' | 'property',
  clave: string,
  valor: string,
  pendientes: Restaurable[],
): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${clave}"]`);
  const creado = el === null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, clave);
    document.head.appendChild(el);
  }
  pendientes.push({ el, previo: creado ? null : el.getAttribute('content'), creado });
  el.setAttribute('content', valor);
}

/** Crea o actualiza <link rel="canonical">, recordando el valor anterior. */
function escribirCanonical(href: string, pendientes: Restaurable[]): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const creado = el === null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  pendientes.push({ el, previo: creado ? null : el.getAttribute('href'), creado });
  el.setAttribute('href', href);
}

/**
 * Aplica metadatos únicos de la página (descripción, canonical, Open Graph y
 * JSON-LD) y los revierte al desmontar, para que la página siguiente no herede
 * los datos de la anterior. No toca el diseño ni la lógica de la vista.
 */
export function Seo({ title, description, path, image, type = 'website', jsonLd = null }: SeoProps) {
  const json = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const pendientes: Restaurable[] = [];
    const url = absoluteUrl(path);
    const imagen = absoluteUrl(image || DEFAULT_OG_IMAGE);

    escribirMeta('name', 'description', description, pendientes);
    escribirMeta('property', 'og:site_name', SITE_NAME, pendientes);
    escribirMeta('property', 'og:title', title, pendientes);
    escribirMeta('property', 'og:description', description, pendientes);
    escribirMeta('property', 'og:type', type, pendientes);
    escribirMeta('property', 'og:url', url, pendientes);
    escribirMeta('property', 'og:image', imagen, pendientes);
    escribirMeta('name', 'twitter:card', 'summary_large_image', pendientes);
    escribirMeta('name', 'twitter:title', title, pendientes);
    escribirMeta('name', 'twitter:description', description, pendientes);
    escribirMeta('name', 'twitter:image', imagen, pendientes);
    escribirCanonical(url, pendientes);

    let script: HTMLScriptElement | null = null;
    if (json) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo', 'jsonld');
      script.textContent = json;
      document.head.appendChild(script);
    }

    return () => {
      for (const { el, previo, creado } of pendientes.reverse()) {
        if (creado) {
          el.remove();
        } else if (previo !== null) {
          if (el.tagName === 'META') el.setAttribute('content', previo);
          else el.setAttribute('href', previo);
        }
      }
      script?.remove();
    };
  }, [title, description, path, image, type, json]);

  return null;
}
