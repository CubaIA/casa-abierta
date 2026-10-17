export function EmergencyButton() {
  const numbers = [
    { name: 'Emergencias', tel: '106' },
    { name: 'Policía', tel: '106' },
    { name: 'Ambulancia', tel: '104' },
  ];
  return (
    <details className="fixed bottom-20 right-4 z-50 md:bottom-4">
      <summary className="cursor-pointer rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-red-700">
        Emergencia
      </summary>
      <div className="mt-2 w-60 rounded-lg border border-red-200 bg-white p-3 text-sm shadow-xl">
        <p className="font-semibold text-red-700">Ayuda de emergencia (Cuba)</p>
        <ul className="mt-2 space-y-1">
          {numbers.map((n) => (
            <li key={n.name} className="flex items-center justify-between">
              <span>{n.name}</span>
              <a className="text-blue-700 underline" href={`tel:${n.tel}`}>
                {n.tel}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-500">
          Para viajeros internacionales, consulta tu embajada/consulado. Este botón es orientativo.
        </p>
      </div>
    </details>
  );
}
