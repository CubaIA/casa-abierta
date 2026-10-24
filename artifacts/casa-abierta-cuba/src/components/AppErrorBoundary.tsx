import { Component, type ErrorInfo, type ReactNode } from 'react';

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
          <p className="font-semibold text-azul">No se pudo mostrar esta pantalla</p>
          <p className="mt-1 text-sm">
            La aplicación falló al dibujar el contenido. Recarga la página para volver a intentarlo.
          </p>
          <p className="mt-3 break-words rounded-lg bg-arena/60 p-2 text-xs text-tinta/70">
            {error.message || 'Error desconocido'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.location.reload()} className="button-primary">
              Recargar
            </button>
            <button type="button" onClick={this.reiniciar} className="button-secondary">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
