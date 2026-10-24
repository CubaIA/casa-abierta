import { Link } from 'wouter';
import { SECTIONS } from '@/lib/sections';
import { SectionCatalog } from '@/components/SectionCatalog';
import { ReviewNote } from '@/components/HomeBlocks';

export default function LGBTQ() {
  return (
    <SectionCatalog
      section={SECTIONS.lgbtq}
      emptyTitle="Aún no hay espacios LGBTQ+ friendly publicados"
      emptyBody="La etiqueta la declara cada proveedor y el equipo la revisa antes de mostrarla en el catálogo."
    >
      <div className="rounded-2xl border border-arena-2 bg-white p-5">
        <h2 className="text-lg font-extrabold text-azul">Qué significa la etiqueta</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta/70">
          LGBTQ+ friendly es una declaración de servicio basada en respeto e inclusión; no es una certificación de
          seguridad ni reemplaza la responsabilidad del proveedor de tratar a cada viajero sin discriminación. Si algo
          no encaja, puedes reportarlo desde la ficha del negocio.
        </p>
        <p className="mt-2 text-sm text-tinta/70">
          <Link href="/providers" className="font-semibold text-azul underline decoration-dotted underline-offset-2">
            Normas para proveedores
          </Link>{' '}
          ·{' '}
          <Link href="/antifraud" className="font-semibold text-azul underline decoration-dotted underline-offset-2">
            Política antifraude
          </Link>
        </p>
      </div>
      <ReviewNote />
    </SectionCatalog>
  );
}
