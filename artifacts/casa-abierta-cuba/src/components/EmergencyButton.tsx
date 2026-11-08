import { AlertTriangle } from 'lucide-react';

export function EmergencyButton() {
  const numbers = [
    { name: 'Policía', tel: '106' },
    { name: 'Ambulancia', tel: '104' },
    { name: 'Bomberos', tel: '105' },
  ];
  return (
    <details className="relative shrink-0">
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-2 text-sm font-bold text-white shadow-lg ring-1 ring-white/25 transition hover:bg-red-700 md:px-3.5 [&::-webkit-details-marker]:hidden"
        aria-label="Emergencias y teléfonos de ayuda"
        title="Emergencia"
      >
        <AlertTriangle size={18} aria-hidden />
        <span className="hidden md:inline">Emergencia</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-red-200 bg-white p-3 text-sm text-tinta shadow-2xl">
        <p className="font-semibold text-red-700">Emergencias en Cuba:</p>
        <ul className="mt-2 space-y-1">
          {numbers.map((n) => (
            <li key={n.name} className="flex items-center justify-between">
              <span>{n.name}:</span>
              <a className="text-blue-700 underline" href={`tel:${n.tel}`}>
                {n.tel}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-semibold text-red-700">Soporte Casa Abierta:</p>
        <p className="mt-1">
          WhatsApp:{' '}
          <a className="text-blue-700 underline" href="https://wa.me/5356289645" target="_blank" rel="noopener noreferrer">
            +53 56289645
          </a>{' '}
          <span className="text-xs text-gray-500">(Horario 8am - 8pm)</span>
        </p>
      </div>
    </details>
  );
}
