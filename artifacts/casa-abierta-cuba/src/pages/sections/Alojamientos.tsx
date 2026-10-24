import { SECTIONS } from '@/lib/sections';
import { SectionCatalog } from '@/components/SectionCatalog';
import { ReviewNote } from '@/components/HomeBlocks';

export default function Alojamientos() {
  return (
    <SectionCatalog
      section={SECTIONS.alojamientos}
      emptyTitle="Aún no hay alojamientos publicados"
      emptyBody="Las propuestas nuevas pasan por revisión antes de aparecer aquí. Vuelve pronto o explora el catálogo completo."
    >
      <div className="rounded-2xl border border-arena-2 bg-white p-5">
        <h2 className="text-lg font-extrabold text-azul">Cómo funciona el alojamiento</h2>
        <ul className="mt-2 space-y-2 text-sm text-tinta/70">
          <li>Elige la casa o habitación y revisa la ficha: fotos, servicios y ubicación aproximada.</li>
          <li>Envía una solicitud al anfitrión; Casa Abierta la registra y facilita la conexión.</li>
          <li>La ubicación exacta se comparte al confirmar la solicitud.</li>
        </ul>
      </div>
      <ReviewNote />
    </SectionCatalog>
  );
}
