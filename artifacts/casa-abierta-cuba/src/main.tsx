import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/toaster';
import './index.css';
import './i18n';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
    <Toaster />
  </AuthProvider>,
);

// PWA: registrar el service worker solo en producción y si el navegador lo soporta.
if ((import.meta as any).env?.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sin SW la app sigue funcionando */
    });
  });
}
