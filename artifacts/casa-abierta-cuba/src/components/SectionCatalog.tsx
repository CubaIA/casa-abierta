import { useCatalog } from '@/hooks/useCatalog';
import { useFavorites } from '@/hooks/useFavorites';
import { sectionBusinesses, type SectionDef } from '@/lib/sections';
import { SectionPage } from './SectionPage';
import { BusinessGrid } from './BusinessGrid';

interface SectionCatalogProps {
  section: SectionDef;
  emptyTitle: string;
  emptyBody?: string;
  /** Contenido propio de la sección, debajo de la rejilla. */
  children?: React.ReactNode;
}

/**
 * Sección con catálogo: carga el catálogo compartido, filtra por el criterio de
 * la sección y lo pinta en rejilla. Las páginas sólo aportan su copy y bloques.
 */
export function SectionCatalog({ section, emptyTitle, emptyBody, children }: SectionCatalogProps) {
  const { businesses, error } = useCatalog();
  const { favoritos, error: favoritesError, toggle } = useFavorites();
  const rows = businesses ? sectionBusinesses(businesses, section) : null;

  return (
    <SectionPage section={section} count={rows?.length ?? null}>
      <BusinessGrid
        items={rows}
        favoritos={favoritos}
        onToggleFavorite={toggle}
        error={error ?? favoritesError}
        emptyTitle={emptyTitle}
        emptyBody={emptyBody}
        emptyCta={{ href: '/', label: 'Ver todo el catálogo' }}
      />
      {children && <div className="mt-10 space-y-6">{children}</div>}
    </SectionPage>
  );
}
