import { useCallback } from 'react';

export function StatusPage() {
  const items = [
    'Actualmente contamos con varios alojamientos registrados.',
    'Operamos en Trinidad, Viñales, Varadero, Camagüey, Santiago y Granma.',
    'El 100% de nuestros perfiles cuenta con revisión de identidad.',
    'Nuestro objetivo para los próximos 90 días es incorporar La Habana y alcanzar nuestras primeras 10 reseñas verificadas.',
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-zinc-900">
      <h1 className="text-3xl font-extrabold text-azul sm:text-4xl">Estado de la Plataforma</h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-600">
        En Casa Abierta Cuba creemos en la transparencia radical. Aquí puedes ver el estado real de nuestro inventario.
      </p>
      <ol className="mt-10 space-y-5">
        {items.map((item, index) => (
          <li key={item} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-azul-100 text-sm font-extrabold text-azul">
              {String(index + 1).padStart(2, '0')}
            </span>
            <p className="text-base leading-relaxed">{item}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
