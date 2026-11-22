/**
 * Campo trampa (honeypot) para los formularios públicos.
 *
 * Queda fuera de la pantalla, oculto con CSS y fuera del orden de tabulación,
 * así que ninguna persona lo ve ni lo alcanza; los robots que rellenan todos
 * los campos lo dejan con valor. El formulario que lo use simplemente lee
 * `valor` y descarta el envío si no está vacío.
 */
interface CampoTrampaProps {
  id: string;
  valor: string;
  onCambio: (valor: string) => void;
}

export function CampoTrampa({ id, valor, onCambio }: CampoTrampaProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <label htmlFor={id}>No rellenar este campo</label>
      <input
        id={id}
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
      />
    </div>
  );
}
