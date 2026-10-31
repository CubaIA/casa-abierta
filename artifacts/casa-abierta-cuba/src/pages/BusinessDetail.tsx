import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Bike,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  ImageOff,
  Languages,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UtensilsCrossed,
  Wifi,
  X,
} from 'lucide-react';
import type { Business, Review } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { firstPhoto, resolvePhotos } from '@/lib/images';
import { formatPrice } from '@/components/BusinessCard';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { AvisoError } from '@/components/AvisoError';
import { FormularioResena } from '@/components/FormularioResena';
import { SelloVerificado } from '@/components/SelloVerificado';
import { adminGetUserAvatarUrl } from '@/lib/avatars';
import { supabase } from '@/lib/supabase';

import {
  createReport,
  getBusiness,
  getBusinessWhatsapp,
  listFavoriteIds,
  listReviews,
  toggleFavorite,
  SERVICE_TYPES,
} from '@/lib/marketplace';
import {
  MENSAJE_NEGOCIO,
  SUPPORT_WHATSAPP,
  telefonoDeNegocio,
  whatsappLink,
} from '@/lib/whatsapp';

/* Cada amenidad lleva su propio icono según lo que dice el texto: los idiomas
 * nunca deben heredar iconos de camas, baños o coches por el orden del array. */
type AmenidadTipo = 'idioma' | 'recomendado' | 'detalle';
interface Amenidad {
  texto: string;
  tipo: AmenidadTipo;
}

/** Minúsculas y sin tildes, para comparar y deduplicar textos. */
function normalizarTexto(valor: string): string {
  return valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Reduce las categorías reales de la BD (service_type, tourism_category,
 * category) a las cuatro familias que usa la ficha. Lo que no sea
 * alojamiento, gastronomía o transporte (guías, tours, servicios) se trata
 * como experiencia: nunca recibe reglas de check-in de una casa.
 */
function familiaDeServicio(business: Business): 'alojamiento' | 'gastronomia' | 'transporte' | 'experiencia' {
  const crudo = normalizarTexto(
    [business.service_type, business.tourism_category, business.category].filter(Boolean).join(' '),
  );
  if (/gastronom|restaurant|paladar|cafeteria|comida|cocina/.test(crudo)) return 'gastronomia';
  if (/transport|taxi|traslado|chofer|alquiler de auto|renta de auto|renta de carro/.test(crudo)) return 'transporte';
  if (/alojamiento|hostal|hospedaje|villa|apartamento|habitacion|casa/.test(crudo)) return 'alojamiento';
  return 'experiencia';
}

function iconoDeAmenidad(amenidad: Amenidad) {
  if (amenidad.tipo === 'idioma') return Languages;
  if (amenidad.tipo === 'recomendado') return Users;
  const t = normalizarTexto(amenidad.texto);
  if (/\bwifi\b|\binternet\b|\bwi-fi\b/.test(t)) return Wifi;
  if (/\bbanos?\b|\bduchas?\b|agua caliente|\baseo\b/.test(t)) return Bath;
  if (/\bcamas?\b|\bhabitacion|\bdormitorio\b|\bsuite\b|\blitera\b/.test(t)) return BedDouble;
  if (/desayuno|\bcomidas?\b|\bcenas?\b|almuerzo|\bmenu\b|cocina|restaurant|cafeteria/.test(t)) return UtensilsCrossed;
  if (/\btaxis?\b|traslado|\btransporte\b|recogida|\bautos?\b|\bcarros?\b|\bvehiculo\b|chofer/.test(t)) return Car;
  if (/bici/.test(t)) return Bike;
  if (/terraza|jardin|playa|piscina|vista|aire acondicionado|ubicaci|malecon|parqueo|estacionamiento/.test(t)) return MapPin;
  if (/familia|grupo|pareja|ninos|capacidad|huesped/.test(t)) return Users;
  return Check;
}

export default function BusinessDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { userId } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewerAvatars, setReviewerAvatars] = useState<Record<string, string | null>>({});
  const [favorite, setFavorite] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [avatarLoadError, setAvatarLoadError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  /** WhatsApp leído aparte: la columna de contacto es privada en producción. */
  const [whatsappPublicado, setWhatsappPublicado] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  /** Registro silencioso de contacto: solo guarda id del negocio y cuándo.
   *  Nunca bloquea ni retrasa la apertura de WhatsApp. */
  const registrarContacto = useCallback(
    async (businessId: string) => {
      if (!supabase) return;
      try {
        await supabase.from('contact_leads').insert({ business_id: businessId });
      } catch {
        /* si la tabla no existe o RLS lo bloquea, ya se abrió WhatsApp */
      }
    },
    [],
  );

  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  /* Hooks de la galería SIEMPRE en la parte superior: nunca después de un
   * early return. Si se declaran tras `if (status...) return`, React lanza
   * el error #310 ("Rendered more hooks than during the previous render")
   * y la página queda en blanco. */
  const [galeriaAbierta, setGaleriaAbierta] = useState(false);
  const [fotoActual, setFotoActual] = useState<number | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const b = await getBusiness(id);
      if (!b) {
        setStatus('error');
        setErrorMessage('No encontramos ese negocio. Puede que haya sido retirado del catálogo.');
        return;
      }
      setBusiness(b);
      setWhatsappPublicado(await getBusinessWhatsapp(id));
      const reviewsList = await listReviews(id);
      setReviews(reviewsList);
      if (userId && reviewsList.length > 0) {
        const owners = new Set<string>(
          reviewsList.map((r) => r.reviewer_id ?? r.user_id ?? '').filter(Boolean),
        );
        const fetched: Record<string, string | null> = {};
        if (supabase) {
          for (const ownerId of owners) {
            try {
              fetched[ownerId] = await adminGetUserAvatarUrl(ownerId);
            } catch {
              fetched[ownerId] = null;
            }
          }
        }
        setReviewerAvatars(fetched);
        setAvatarLoadError(null);
      }
      if (userId) {
        const ids = await listFavoriteIds(userId);
        setFavorite(ids.includes(id));
      }
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Error cargando el negocio');
    }
  }, [id, userId]);

  useEffect(() => {
    if (!id) return;
    void load();
  }, [id, load]);

  /** Recarga solo las reseñas tras publicar una: evita el parpadeo de `load`. */
  const recargarResenas = useCallback(async () => {
    try {
      setReviews(await listReviews(id));
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'No se pudieron recargar las reseñas');
    }
  }, [id]);

  useEffect(() => {
    if (!business?.name) return;
    document.title = `${business.name} | Casa Abierta Cuba`;
  }, [business?.name]);

  async function onFavorite() {
    if (!userId) {
      navigate('/entrar');
      return;
    }
    try {
      const next = await toggleFavorite(userId, id);
      setFavorite(next);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'No se pudo actualizar el favorito');
    } finally {
      // Consistencia local rápida aunque el servidor falle en algún entorno:
      // volvemos a calcular el estado desde el backend cuando hay sesión.
      if (userId && business) {
        try {
          const ids = await listFavoriteIds(userId);
          setFavorite(ids.includes(id));
        } catch {
          /* sin efecto */
        }
      }
    }
  }

  async function onShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({ title: business?.name ?? 'Casa Abierta Cuba', url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      /* el usuario canceló el diálogo o el portapapeles no está disponible */
    }
  }

  async function onReport(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      navigate('/entrar');
      return;
    }
    try {
      await createReport({ reporterId: userId, targetType: 'business', targetId: id, reason: reportReason.trim() });
      setReportSent(true);
      setReportReason('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo enviar el reporte');
    }
  }

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="h-[280px] animate-pulse rounded-2xl bg-azul/10 sm:h-[420px]" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded-full bg-azul/10" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded-full bg-azul/10" />
        <span className="sr-only">Cargando ficha…</span>
      </div>
    );
  }

  if (status === 'error' || !business) {
    return (
      <div className="page-shell">
        <AvisoError mensaje={errorMessage} />
        <button className="button-ghost mt-4" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
      </div>
    );
  }

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const favoritoEntreHuespedes = avg !== null && avg >= 4.8;
  const tipoLabel =
    SERVICE_TYPES.find((s) => s.value === business?.service_type)?.label ??
    (business?.service_type ?? '').charAt(0).toUpperCase() + (business?.service_type ?? '').slice(1);
  const precio = formatPrice(business) ?? 'Consultar';
  /* Contacto directo: el WhatsApp del anuncio o, si la BD no lo expone al
   * público, el de soporte para que nadie se quede sin poder escribir. */
  const whatsappNegocio = telefonoDeNegocio(business) ?? whatsappPublicado;
  const enlaceWhatsapp = whatsappNegocio
    ? whatsappLink(whatsappNegocio, MENSAJE_NEGOCIO)
    : whatsappLink(SUPPORT_WHATSAPP, `${MENSAJE_NEGOCIO} (${business.name || 'un negocio'})`);
  const unidad = business.service_type === 'alojamiento' ? 'por noche' : 'precio orientativo';
  const foto = firstPhoto(business, { skipFirstLogoWhenAvailable: true });
  const fotosValidas = resolvePhotos(business);
  const miniaturas = fotosValidas.slice(0, 4);
  const hayGaleria = fotosValidas.length > 1;

  /* Datos de Supabase blindados: cualquier campo puede venir null/vacío.
   * Todos los split/join trabajan sobre strings o arrays ya validados. */
  /* El anfitrión es el dueño del negocio, nunca la persona con sesión: si el
   * anuncio no publica `host_name` se usa un texto genérico. */
  const nombreAnfitrion = String(business?.host_name ?? '').trim();
  const historiaAnfitrion = String(business?.host_story ?? '').trim();
  const nombreCompuesto = nombreAnfitrion || String(business?.name ?? '');
  const iniciales = nombreCompuesto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const detalles = String(business?.experience_details ?? '');
  const idiomas = Array.isArray(business?.languages) ? business.languages : [];
  const recomendados = Array.isArray(business?.recommended_for) ? business.recommended_for : [];
  /* El horario puede ser texto libre o JSON ({check_in, check_out}). */
  const schedule = (() => {
    const bruto = typeof business?.schedule === 'string' ? business.schedule.trim() : '';
    if (!bruto.startsWith('{')) return bruto;
    try {
      const h = JSON.parse(bruto) as { check_in?: unknown; check_out?: unknown };
      const hora = (v: unknown) => (typeof v === 'string' ? v.slice(0, 5) : '');
      const entrada = hora(h.check_in);
      const salida = hora(h.check_out);
      if (entrada && salida) return `Check-in ${entrada} · Check-out ${salida}`;
      if (entrada) return `Check-in ${entrada}`;
      if (salida) return `Check-out ${salida}`;
      return '';
    } catch {
      return bruto;
    }
  })();

  /* Idiomas sin duplicados («Español» y «español» son el mismo idioma). */
  const idiomasUnicos = (() => {
    const vistos = new Set<string>();
    const lista: string[] = [];
    for (const idioma of idiomas) {
      const limpio = String(idioma ?? '').trim();
      if (!limpio) continue;
      const clave = normalizarTexto(limpio);
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      lista.push(limpio);
    }
    return lista;
  })();

  /* «Habla X» / «Idiomas: X» escritos dentro de los detalles no se repiten:
   * los idiomas ya salen de `languages` con su icono propio. */
  const esLineaDeIdioma = (texto: string) => /^(habla\b|idiomas?\s*:)/i.test(texto);

  const amenidades: Amenidad[] = (() => {
    const vistos = new Set<string>();
    const lista: Amenidad[] = [];
    const agregar = (texto: string, tipo: AmenidadTipo) => {
      const limpio = texto.replace(/\s+/g, ' ').trim();
      if (!limpio) return;
      const clave = normalizarTexto(limpio);
      if (vistos.has(clave)) return;
      vistos.add(clave);
      lista.push({ texto: limpio, tipo });
    };
    detalles
      .split('·')
      .map((s) => s.trim())
      .filter((s) => s && !esLineaDeIdioma(s))
      .forEach((s) => agregar(s, 'detalle'));
    idiomasUnicos.forEach((idioma) => agregar(`Habla ${idioma}`, 'idioma'));
    recomendados.forEach((r) => agregar(`Ideal para ${r}`, 'recomendado'));
    return lista;
  })();

  /* Reglas de visita según la familia de servicio: solo el alojamiento tiene
   * check-in y check-out. Taxis, guías y experiencias muestran su horario o
   * un texto de coordinación con el anfitrión. */
  const familia = familiaDeServicio(business);
  const bloquesLoQueDebesSaber: string[] = (() => {
    switch (familia) {
      case 'alojamiento':
        /* El horario guardado en la BD manda; el texto fijo es sólo el respaldo
         * para las fichas antiguas que todavía no tienen `schedule`. */
        return [schedule || 'Llegada después de las 15:00, salida antes de las 11:00. Sin fiestas ni eventos.'];
      case 'transporte':
        return [
          schedule ||
            'Servicio de transporte privado. Coordina la recogida y el horario directamente con el anfitrión.',
        ];
      case 'gastronomia':
        return [schedule || 'Horario: Consultar directamente con el anfitrión'];
      default:
        return [
          schedule ||
            'Experiencia guiada. Coordina el punto de encuentro y los detalles directamente con el anfitrión.',
        ];
    }
  })();

  const subtitulo = [
    `${tipoLabel} en ${business.municipality || '—'}, ${business.province || '—'}`,
    (recomendados.length > 0 ? `Ideal para ${recomendados.join(', ')}` : null) ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  function abrirGaleriaEn(indice: number) {
    setFotoActual(indice);
    setGaleriaAbierta(true);
  }

  function cerrarGaleria() {
    setGaleriaAbierta(false);
    setFotoActual(null);
  }

  function fotoPrevia() {
    if (fotoActual === null) return;
    setFotoActual((fotoActual > 0 ? fotoActual - 1 : fotosValidas.length - 1));
  }

  function fotoSiguiente() {
    if (fotoActual === null) return;
    setFotoActual((fotoActual < fotosValidas.length - 1 ? fotoActual + 1 : 0));
  }  function seccionGaleria() {
    if (!business) return null;
    return (
      <section className="mt-5" aria-label="Galería de fotos">
        <div className="flex items-center gap-3">
          <p className="text-sm font-extrabold text-azul">Fotos del anuncio</p>
          {hayGaleria && (
            <span className="text-xs text-tinta/60">
              {fotosValidas.length} fotos
            </span>
          )}

        </div>

        {miniaturas.length === 0 ? (
          <div className="mt-3 flex h-40 items-center justify-center rounded-2xl border border-dashed border-arena-2 bg-azul-50 text-sm text-tinta/50">
            {ImageOff && <ImageOff size={20} className="mr-2" />}
            Sin fotos disponibles
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-4">
            {miniaturas.map((url, i) => (
              <button
                key={`${business.id}-${i}-${url}`}
                type="button"
                onClick={() => abrirGaleriaEn(i)}
                className={`group relative overflow-hidden rounded-xl bg-azul-700 border border-arena-2 disabled:opacity-50 ${i === 0 ? 'ring-2 ring-azul ring-offset-2' : ''}`}
                aria-label={`Ver foto ${i + 1}`}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`Foto ${i + 1} de ${business.name}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full place-items-center text-white/60">
                    <ImageOff size={20} />
                  </div>
                )}
                {i === 0 && (
                  <span className="absolute left-1.5 bottom-1.5 rounded-full bg-azul/80 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white sr-only sm:not-sr-only">
                    Portada
                  </span>
                )}
              </button>
            ))}
            {hayGaleria && (
              <button
                type="button"
                onClick={() => abrirGaleriaEn(miniaturas.length)}
                className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-arena-2 bg-white/60 text-center text-sm text-tinta/60 transition hover:bg-white hover:border-arena"
                aria-label={`Ver resto de fotos (${fotosValidas.length - miniaturas.length} más)`}
              >
                {fotosValidas.length - miniaturas.length} más
              </button>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-40 pt-3 md:pb-28">
      {/* ---------------------------------------------------------- */}
      {/* Galería superior                                            */}
      {/* ---------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-2xl bg-azul-700 sm:rounded-3xl">
        <div className="h-[300px] w-full sm:h-[420px]">
          {foto ? (
            <img src={foto} alt={`Foto de ${business.name}`} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-azul to-azul-700 text-white/70">
              <ImageOff size={44} aria-hidden />
            </div>
          )}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent"
        />

        <button
          type="button"
          onClick={() => navigate('/')}
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-azul shadow transition hover:bg-white"
        >
          <ArrowLeft size={17} aria-hidden /> Volver
        </button>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void onShare()}
            aria-label="Compartir esta publicación"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-azul shadow transition hover:bg-white"
          >
            {copiado ? <Check size={18} aria-hidden /> : <Share2 size={18} aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => void onFavorite()}
            aria-pressed={favorite}
            aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-azul shadow transition hover:bg-white"
          >
            <Heart size={18} aria-hidden className={favorite ? 'fill-[#FF385C] text-[#FF385C]' : ''} />
          </button>
        </div>
        {copiado && (
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white">
            Enlace copiado
          </p>
        )}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Información principal                                       */}
      {/* ---------------------------------------------------------- */}
      <div className="mt-5">
        <h1 className="text-2xl font-extrabold text-azul sm:text-3xl">{business.name || 'Negocio'}</h1>
        <p className="mt-1 text-tinta/70">{subtitulo}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
          {/* Sello de calidad de la plataforma: solo si el admin verificó el negocio. */}
          <SelloVerificado verified={business?.verified === true} variant="full" />
          {/* Solo con sello Y documentación legal validada por el admin. */}
          {business?.verified === true && business?.legal_validated === true && (
            <p className="w-full text-xs font-semibold text-verde-700">
              ✓ Documentación legal y permisos revisados por el equipo de Casa Abierta Cuba
            </p>
          )}
          <span className="inline-flex items-center gap-1 font-bold text-tinta">
            <Star size={14} className="fill-tinta" aria-hidden />
            {avg !== null ? avg.toFixed(2) : 'Nuevo'}
          </span>
          {avg !== null && (
            <span className="flex items-center gap-0.5 text-dorado" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={13} className={i < Math.round(avg) ? 'fill-dorado' : 'opacity-25'} />
              ))}
            </span>
          )}
          <span className="text-tinta/60">
            · {reviews.length} reseña{reviews.length === 1 ? '' : 's'}
          </span>
          {favoritoEntreHuespedes && (
            <span className="inline-flex items-center gap-1 rounded-full bg-arena px-2.5 py-1 text-xs font-bold text-azul-700">
              <Sparkles size={12} aria-hidden /> Favorito entre huéspedes
            </span>
          )}
          {(business?.lgbt_friendly ?? false) && (
            <span className="rounded-full bg-verde/10 px-2.5 py-1 text-xs font-bold text-verde-700">
              LGBTQ+ friendly
            </span>
          )}
        </div>
      </div>

      <hr className="my-6 border-arena-2" />

      {/* Anfitrión */}
      <div className="flex items-center gap-4">
        <div
          aria-hidden
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-azul text-lg font-extrabold text-white"
        >
          {iniciales || 'CA'}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-azul">
            Anfitrión: {nombreAnfitrion || 'Anfitrión de Casa Abierta'}
          </p>
          <p className="text-sm text-tinta/70">
            {(business?.verified ?? false) || favoritoEntreHuespedes ? 'SuperAnfitrión' : 'Anfitrión local'} · Casa Abierta Cuba
          </p>
          <p className="text-xs text-tinta/55">
            Índice de respuesta: rápido · Responde por la plataforma
          </p>
        </div>
      </div>

      <hr className="my-6 border-arena-2" />        {/* Descripción y amenidades */}
      <section>
        <h2 className="text-lg font-extrabold text-azul">Sobre este lugar</h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed text-tinta/85">{(business?.description ?? '').trim() || ''}</p>


        {amenidades.length > 0 && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {amenidades.map((a, i) => {
              const Icon = iconoDeAmenidad(a);
              return (
                <li key={`${a.texto}-${i}`} className="flex items-start gap-3 text-sm text-tinta/80">
                  <Icon size={19} aria-hidden className="mt-0.5 shrink-0 text-azul-600" />
                  <span>{a.texto}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Secciones desplegables                                      */}
      {/* ---------------------------------------------------------- */}
      <div className="mt-8 divide-y divide-arena-2 border-y border-arena-2">
        <Desplegable titulo="Conoce al anfitrión" abierto>
          {/* La biografía sale de `host_story` (o su alias `host_bio`), nunca de
              `description` ni de las amenidades: mezclar ambas era el cruce que
              mostraba la descripción de la habitación como historia. */}
          {historiaAnfitrion ? (
            <p className="leading-relaxed text-tinta/85">{historiaAnfitrion}</p>
          ) : (
            <p className="text-tinta/60">Este anfitrión todavía no ha escrito su historia.</p>
          )}
          {detalles && (
            <>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-wide text-azul/70">
                Detalles de la experiencia
              </p>
              <p className="mt-1 leading-relaxed text-tinta/75">{detalles}</p>
            </>
          )}
          <p className="mt-3 text-sm text-tinta/60">
            <Languages size={14} aria-hidden className="mr-1 inline" />
            {idiomasUnicos.length > 0 ? `Idiomas: ${idiomasUnicos.join(', ')}` : 'Idiomas: español'}
          </p>
        </Desplegable>

        <Desplegable titulo="Lo que debes saber">
          <div className="rounded-xl border border-arena-2 bg-white p-4">
            <div className="space-y-3 text-sm text-tinta/85">
              {bloquesLoQueDebesSaber.map((bloque) => (
                <p key={bloque} className="leading-relaxed text-tinta/70">
                  {bloque}
                </p>
              ))}
            </div>
          </div>
        </Desplegable>

        <Desplegable titulo="A dónde irás">
          <div className="relative h-52 overflow-hidden rounded-xl border border-arena-2 bg-[#e8eef2]">
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'linear-gradient(#c9d8e2 1px, transparent 1px), linear-gradient(90deg, #c9d8e2 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex flex-col items-center gap-1 rounded-xl bg-white/90 px-4 py-3 text-center shadow">
                <MapPin size={22} aria-hidden className="text-terracota-600" />
                <p className="text-sm font-bold text-azul">
                  {business.municipality}, {business.province}
                </p>
                <p className="text-xs text-tinta/60">La ubicación exacta se comparte al confirmar la solicitud</p>
              </div>
            </div>
          </div>
        </Desplegable>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Reseñas                                                     */}
      {/* ---------------------------------------------------------- */}
      <section className="mt-8" aria-label="Reseñas">
        {avatarLoadError && (
          <p className="mb-2 text-xs text-terracota-700" role="status">
            No se pudieron cargar algunas fotos de los reseñantes.
          </p>
        )}
        <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-azul">
          <Star size={18} className="fill-azul" aria-hidden />
          {avg !== null ? `${avg.toFixed(2)} · ` : ''}
          {reviews.length} reseña{reviews.length === 1 ? '' : 's'}
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-2 text-sm text-tinta/60">Aún no hay reseñas para este negocio.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {reviews.map((r) => {
              const autorId = r.reviewer_id ?? r.user_id ?? '';
              return (
              <li key={r.id} className="rounded-2xl border border-arena-2 bg-white p-4">
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    avatarUrl={autorId ? reviewerAvatars[autorId] ?? null : null}
                    userId={autorId}
                    size={36}
                    upload={false}
                  />
                  <div>
                    <p className="text-sm font-semibold text-azul">{r.comment ? 'Anónimo' : 'Viajero'}</p>
                    <div className="flex items-center gap-0.5 text-dorado" aria-label={`${r.rating} de 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={13} className={i < r.rating ? 'fill-dorado' : 'opacity-25'} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-sm text-tinta/80">{r.comment || 'Reseña breve'}</p>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        )}

        <FormularioResena businessId={id} userId={userId} onEnviada={recargarResenas} />
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Contacto directo por WhatsApp                               */}
      {/* ---------------------------------------------------------- */}
      <section id="contacto" className="mt-8 scroll-mt-24 rounded-2xl border border-arena-2 bg-white p-5 sm:p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-azul">
          <MessageCircle size={18} aria-hidden /> Contacta directo con el anfitrión
        </h2>
        <p className="mt-1 text-sm text-tinta/65">
          Sin formularios ni esperas: escríbele por WhatsApp y coordina fechas, precios y detalles del servicio. La
          conversación y el pago se acuerdan directamente con el anfitrión.
        </p>

        <a
          href={enlaceWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            void registrarContacto(id);
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-[#25D366]/30 transition hover:bg-[#1EBE5B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1EBE5B]"
        >
          <MessageCircle size={22} aria-hidden /> Contactar directo por WhatsApp
        </a>

        <p className="mt-2 text-xs text-tinta/55">
          {whatsappNegocio
            ? 'Se abre WhatsApp con un mensaje ya escrito. Puedes editarlo antes de enviarlo.'
            : 'Este anuncio aún no publica su número: escríbenos y te conectamos con el anfitrión.'}
        </p>
      </section>

      {/* Reportar */}
      <div className="mt-6">
        <button
          className="inline-flex items-center gap-1 text-sm font-semibold text-terracota-600 hover:underline"
          onClick={() => setReportOpen((v) => !v)}
        >
          <Flag size={14} /> Reportar esta publicación
        </button>
        {reportOpen &&
          (reportSent ? (
            <p className="form-success">Reporte enviado. El equipo de Casa Abierta lo revisará.</p>
          ) : (
            <form onSubmit={onReport} className="panel mt-3">
              <label className="field-label" htmlFor="report-reason">¿Qué está mal en esta publicación?</label>
              <textarea
                id="report-reason"
                className="field-input"
                rows={3}
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe el problema (fotos engañosas, datos falsos, etc.)"
              />
              <button className="button-primary mt-3" type="submit">Enviar reporte</button>
            </form>
          ))}
      </div>

      {errorMessage && status === 'ready' && <AvisoError mensaje={errorMessage} className="mt-4" />}

      {seccionGaleria()}

      {/* Galería modal ligera */}
      {galeriaAbierta && fotoActual !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Galería de fotos de ${business?.name ?? ''}`}
          className="fixed inset-0 z-50 bg-black/90 p-4 backdrop-blur-sm"
          onClick={cerrarGaleria}
        >
          <button
            type="button"
            onClick={cerrarGaleria}
            className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-sm font-semibold text-azul shadow transition hover:bg-white"
            aria-label="Cerrar galería"
          >
            <X size={16} />
            Cerrar
          </button>

          <div
            className="relative mx-auto w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {fotosValidas.length === 0 ? (
              <div className="mx-auto h-[70vh] flex items-center justify-center text-white/70">
                <ImageOff size={40} className="mb-3" />
                <p className="text-sm">Sin fotos disponibles</p>
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-xl bg-azul-900">
                  {fotoActual > 0 && (
                    <button
                      type="button"
                      onClick={fotoPrevia}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-azul shadow transition hover:bg-white"
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft size={20} />
                    </button>
                  )}

                  <img
                    src={fotosValidas[fotoActual]}
                    alt={`Foto ${fotoActual + 1} de ${business?.name ?? ''}`}
                    className="h-[70vh] w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                    }}
                  />

                  {fotoActual < fotosValidas.length - 1 && (
                    <button
                      type="button"
                      onClick={fotoSiguiente}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-azul shadow transition hover:bg-white"
                      aria-label="Foto siguiente"
                    >
                      <ChevronRight size={20} />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className="text-tinta/70">
                    Foto {fotoActual + 1} de {fotosValidas.length}
                  </p>
                  <button
                    type="button"
                    onClick={cerrarGaleria}
                    className="rounded-full bg-white/90 px-4 py-1.5 text-azul font-semibold shadow transition hover:bg-white"
                  >
                    <X size={14} />
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sección desplegable                                                 */
/* ------------------------------------------------------------------ */

function Desplegable({
  titulo,
  abierto = false,
  children,
}: {
  titulo: string;
  abierto?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details className="group py-4" open={abierto}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-extrabold text-azul">
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={17} aria-hidden className="text-azul-600" />
          {titulo}
        </span>
        <ChevronDown
          size={20}
          aria-hidden
          className="shrink-0 text-tinta/50 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="mt-3 text-sm">{children}</div>
    </details>
  );
}
