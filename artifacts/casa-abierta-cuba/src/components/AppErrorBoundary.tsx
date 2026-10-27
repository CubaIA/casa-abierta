import { Component, type ErrorInfo, type ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { WHATSAPP_AYUDA } from './AvisoError';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Red de seguridad de renderizado.
 *
 * React desmonta todo el árbol cuando un componente lanza un error y no hay
 * ningún límite que lo capture: la app se quedaba en blanco, sólo con el fondo
 * crema, sin ningún mensaje. Este límite no altera la lógica de ninguna vista
 * (si todo va bien es transparente); sólo dibuja la cabecera y un aviso legible
 * con el error real para poder diagnosticarlo.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error de renderizado en Casa Abierta:', error, info.componentStack);
  }

  private reiniciar = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="page-shell" role="alert">
        <div className="empty-state text-left">
          <p className="text-lg font-extrabold text-azul">No se pudo mostrar esta pantalla</p>
          {/* El detalle técnico (error.message) queda en la consola: al usuario
           *  se le da una salida humana y un canal directo para resolverlo. */}
          <p className="mt-2 text-sm leading-relaxed">
            ¡Ups! Parece que tuvimos un problema técnico (¡culpa de los apagones o del servidor!). No te
            preocupes, escríbenos directo a nuestro WhatsApp{' '}
            <a
              href={WHATSAPP_AYUDA}
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-azul underline decoration-dotted underline-offset-2"
            >
              haciendo clic aquí
            </a>{' '}
            y te ayudamos a reservar ahora mismo.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.location.reload()} className="button-primary">
              Recargar
            </button>
            <button type="button" onClick={this.reiniciar} className="button-secondary">
              Reintentar
            </button>
            <a
              href={WHATSAPP_AYUDA}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95"
            >
              <MessageCircle size={16} aria-hidden /> Escribir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }
}
