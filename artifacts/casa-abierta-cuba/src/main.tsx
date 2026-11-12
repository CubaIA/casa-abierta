import { useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import i18n from './i18n';
import './index.css';

/**
 * Espera a que i18next detecte el idioma (localStorage → navegador) y cargue
 * el archivo de traducción antes de pintar la app. Así no se ve un primer
 * render en español que luego cambia al idioma correcto.
 */
function EsperarIdioma({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(false);

  useEffect(() => {
    let vivo = true;

    const cargar = () => {
      void i18n
        .loadNamespaces('common')
        .catch(() => {
          /* si falla la red, se pinta la app con el idioma de respaldo */
        })
        .finally(() => {
          if (vivo) setListo(true);
        });
    };

    if (i18n.isInitialized) cargar();
    else i18n.on('initialized', cargar);

    return () => {
      vivo = false;
      i18n.off('initialized', cargar);
    };
  }, []);

  if (!listo) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-crema"
        role="status"
        aria-live="polite"
        aria-label="Cargando Casa Abierta"
      >
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-azul/25 border-t-azul" />
      </div>
    );
  }

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <EsperarIdioma>
    <AuthProvider>
      <App />
      <Toaster />
    </AuthProvider>
  </EsperarIdioma>,
);

// PWA: registrar el service worker solo en producción y si el navegador lo soporta.
if ((import.meta as any).env?.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sin SW la app sigue funcionando */
    });
  });
}
