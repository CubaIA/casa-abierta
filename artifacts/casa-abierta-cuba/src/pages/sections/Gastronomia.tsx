import { SECTIONS } from '@/lib/sections';
import { SectionCatalog } from '@/components/SectionCatalog';
import { ReviewNote } from '@/components/HomeBlocks';

export default function Gastronomia() {
  return (
    <SectionCatalog
      section={SECTIONS.gastronomia}
      emptyTitle="Aún no hay mesas publicadas"
      emptyBody="Los paladares y cafeterías aparecen en cuanto el equipo revisa su propuesta."
    >
      <div className="rounded-2xl border border-arena-2 bg-white p-5">
        <h2 className="text-lg font-extrabold text-azul">Mesas con sabor local</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta/70">
          Paladares, cafeterías y cocina criolla servida por quien la cocina. En cada ficha encuentras el
          horario, el precio orientativo y el contacto para coordinar tu visita con el negocio.
        </p>
      </div>
      <ReviewNote />
    </SectionCatalog>
  );
}
