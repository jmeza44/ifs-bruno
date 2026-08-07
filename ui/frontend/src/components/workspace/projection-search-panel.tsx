import { useEffect } from 'react';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { ProjectionCombobox } from '@/components/workspace/projection-combobox';
import { ProjectionDetailCard } from '@/components/workspace/projection-detail-card';
import { ProjectionFiltersBar } from '@/components/workspace/projection-filters-bar';
import { useProjectionFilters } from '@/hooks/useProjectionFilters';
import type { IfsProjection } from '@/lib/types';

export type ProjectionSearchPanelProps = {
  profileName: string;
  projections: IfsProjection[];
  isLoading?: boolean;
  selected: IfsProjection | null;
  onSelect: (projection: IfsProjection | null) => void;
  onContinue?: (projection: IfsProjection) => void;
  isContinuing?: boolean;
};

export function ProjectionSearchPanel({
  profileName,
  projections,
  isLoading,
  selected,
  onSelect,
  onContinue,
  isContinuing,
}: ProjectionSearchPanelProps) {
  const filters = useProjectionFilters(projections);

  // Keep the input text in sync when `selected` is set from outside this
  // component (e.g. returning from the endpoint list with a projection
  // already chosen) rather than through the combobox's own selection flow.
  const selectedProjectionName = selected?.ProjectionName ?? null;
  useEffect(() => {
    filters.setSearchTerm(selectedProjectionName ?? '');
    // filters.setSearchTerm is stable (from useState); only re-sync on selection change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectionName]);

  return (
    <div className="flex h-full w-full items-start justify-center p-4">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <MagnifyingGlassIcon className="size-5 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Search IFS projection</span>
          <span className="text-xs text-muted-foreground">
            Active profile: <span className="font-medium text-foreground">{profileName}</span>
          </span>
        </div>

        <ProjectionFiltersBar
          component={filters.component}
          onComponentChange={filters.setComponent}
          components={filters.components}
          apiClass={filters.apiClass}
          onApiClassChange={filters.setApiClass}
          apiClasses={filters.apiClasses}
          layer={filters.layer}
          onLayerChange={filters.setLayer}
          layers={filters.layers}
          showDeprecated={filters.showDeprecated}
          onShowDeprecatedChange={filters.setShowDeprecated}
        />

        <ProjectionCombobox
          items={filters.rankedProjections}
          selected={selected}
          onSelect={onSelect}
          searchTerm={filters.searchTerm}
          onSearchTermChange={filters.setSearchTerm}
          isLoading={isLoading}
        />

        <ProjectionDetailCard
          selected={selected}
          onContinue={onContinue}
          isContinuing={isContinuing}
        />
      </div>
    </div>
  );
}
