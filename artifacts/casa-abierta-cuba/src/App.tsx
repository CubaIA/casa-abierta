import { Route, Switch, useLocation } from 'wouter';
import { lazy, Suspense, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/auth';
import NotFound from '@/pages/not-found';
import { InformationPage } from '@/pages/information';

const Home = lazy(() => import('@/pages/Home'));
const BusinessDetail = lazy(() => import('@/pages/BusinessDetail'));
const Entrar = lazy(() => import('@/pages/Entrar'));
const MisSolicitudes = lazy(() => import('@/pages/MisSolicitudes'));
const Favoritos = lazy(() => import('@/pages/Favoritos'));
const Anfitrion = lazy(() => import('@/pages/Anfitrion'));
const Admin = lazy(() => import('@/pages/Admin'));
const Contacto = lazy(() => import('@/pages/Contacto'));
const ChatIA = lazy(() => import('@/pages/ChatIA'));
const Perfil = lazy(() => import('@/pages/Perfil'));


function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

/** Muestra un splash mientras se restaura la sesión (evita parpadeos de rutas protegidas). */
function useSessionReady() {
  const { loading } = useAuth();
  return !loading;
}

export default function App() {
  const ready = useSessionReady();

  return (
    <Layout>
      <ScrollToTop />
      {!ready ? (
        <div className="page-shell">
          <div className="empty-state">Cargando Casa Abierta…</div>
        </div>
      ) : (
        <Suspense fallback={<div className="page-shell"><div className="empty-state">Cargando...</div></div>}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/negocio/:id" component={BusinessDetail} />
            <Route path="/entrar" component={Entrar} />
            <Route path="/perfil" component={Perfil} />
            <Route path="/solicitudes" component={MisSolicitudes} />
            <Route path="/favoritos" component={Favoritos} />
            <Route path="/anfitrion" component={Anfitrion} />
            <Route path="/admin" component={Admin} />
            <Route path="/contacto" component={Contacto} />
            <Route path="/chat" component={ChatIA} />
            <Route path="/about" component={() => <InformationPage kind="about" />} />
            <Route path="/privacy" component={() => <InformationPage kind="privacy" />} />
            <Route path="/terms" component={() => <InformationPage kind="terms" />} />
            <Route path="/providers" component={() => <InformationPage kind="providers" />} />
            <Route path="/antifraud" component={() => <InformationPage kind="antifraud" />} />
            <Route component={NotFound} />
          </Switch>
        )}
      </div>
    </Layout>
  );
}
