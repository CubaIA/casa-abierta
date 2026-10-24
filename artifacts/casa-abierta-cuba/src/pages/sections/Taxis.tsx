import { SECTIONS } from '@/lib/sections';
import { SectionCatalog } from '@/components/SectionCatalog';
import { ReviewNote } from '@/components/HomeBlocks';

export default function Taxis() {
  return (
    <SectionCatalog
      section={SECTIONS.taxis}
      emptyTitle="Aún no hay taxis ni traslados publicados"
      emptyBody="Los choferes y agencias aparecen aquí después de la revisión de su propuesta."
    >
      <div className="rounded-2xl border border-arena-2 bg-white p-5">
        <h2 className="text-lg font-extrabold text-azul">Traslados con choferes locales</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta/70">
          Traslados al aeropuerto, recorridos por la ciudad y viajes entre provincias. Casa Abierta conecta viajeros y
          proveedores: el precio, el vehículo y el horario se acuerdan directamente con el chofer al coordinar la
          solicitud.
        </p>
      </div>
      <ReviewNote />
    </SectionCatalog>
  );
}
