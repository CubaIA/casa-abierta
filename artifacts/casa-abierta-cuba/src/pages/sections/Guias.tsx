import { SECTIONS } from '@/lib/sections';
import { SectionCatalog } from '@/components/SectionCatalog';
import { ReviewNote } from '@/components/HomeBlocks';

export default function Guias() {
  return (
    <SectionCatalog
      section={SECTIONS.guias}
      emptyTitle="Aún no hay guías publicados"
      emptyBody="Cada guía se revisa antes de publicarse. Mientras tanto, puedes explorar el resto del catálogo."
    >
      <div className="rounded-2xl border border-arena-2 bg-white p-5">
        <h2 className="text-lg font-extrabold text-azul">Con quién vas a recorrer</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta/70">
          En la ficha de cada guía ves su provincia, los idiomas que habla y las experiencias que ofrece. Envía una
          solicitud desde la publicación para acordar la ruta, la duración y el precio directamente con el guía.
        </p>
      </div>
      <ReviewNote />
    </SectionCatalog>
  );
}
