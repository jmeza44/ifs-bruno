import { Group, Panel, Separator } from 'react-resizable-panels';
import { CollectionDetailsPanel } from '@/components/workspace/collection/collection-details-panel';
import { CollectionEndpointsTree } from '@/components/workspace/collection/collection-endpoints-tree';
import { EndpointListPanel } from '@/components/workspace/endpoint/endpoint-list-panel';
import { EndpointDetailPanel } from '@/components/workspace/endpoint/endpoint-detail-panel';
import { ProjectionSearchPanel } from '@/components/workspace/projection/projection-search-panel';
import type { CollectionEntry, CollectionFolder, EndpointDetail, IfsProjection } from '@/lib/types';
import type { CollectionDetails } from '@/components/workspace/collection/collection-details-panel';
import type { EndpointListEntry } from '@/components/workspace/endpoint/endpoint-list-panel';
import { workspaceActions } from '@/lib/workspace-store';
import { DotsSixVerticalIcon } from '@phosphor-icons/react';

export type WorkspaceCanvasProps = {
  activeCollection: CollectionEntry | null;
  collectionDetails: CollectionDetails | null;
  folders: CollectionFolder[];
  activeProfileName: string | null;
  isSearchingProjection: boolean;
  searchedProjection: IfsProjection | null;
  onSelectSearchedProjection: (projection: IfsProjection | null) => void;
  projections: IfsProjection[];
  isLoadingProjections: boolean;
  onContinueProjection: (projection: IfsProjection) => void;
  isLoadingProjection: boolean;
  availableEndpoints: EndpointListEntry[];
  selectedToAdd: Set<string>;
  alreadyInCollection: Set<string>;
  activeEndpointDetail: EndpointDetail | null;
  onViewDetail: (entry: EndpointListEntry) => void;
  onSave: () => void;
  isSaving: boolean;
};

function ResizableHandle() {
  return (
    <Separator className="group relative w-px bg-transparent transition-colors hover:bg-border data-active:bg-primary h-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 px-0.5 bg-muted rounded-lg overflow-hidden opacity-0 transition-opacity group-hover:opacity-100">
        <DotsSixVerticalIcon size={12} className="pointer-events-none text-muted-foreground" />
      </div>
    </Separator>
  );
}

export function WorkspaceCanvas({
  activeCollection,
  collectionDetails,
  folders,
  activeProfileName,
  isSearchingProjection,
  searchedProjection,
  onSelectSearchedProjection,
  projections,
  isLoadingProjections,
  onContinueProjection,
  isLoadingProjection,
  availableEndpoints,
  selectedToAdd,
  alreadyInCollection,
  activeEndpointDetail,
  onViewDetail,
  onSave,
  isSaving,
}: WorkspaceCanvasProps) {
  const activeEndpointId = activeEndpointDetail?.id;

  return (
    <div className="min-h-0 flex-1 p-2 relative">
      <Group className="gap-x-2">
        <Panel className="flex gap-2">
          {isSearchingProjection && activeProfileName ? (
            <ProjectionSearchPanel
              profileName={activeProfileName}
              projections={projections}
              isLoading={isLoadingProjections}
              selected={searchedProjection}
              onSelect={onSelectSearchedProjection}
              onContinue={onContinueProjection}
              isContinuing={isLoadingProjection}
            />
          ) : (
            <Group className="gap-x-2">
              <Panel defaultSize="30%" minSize="30%" maxSize="50%">
                <EndpointListPanel
                  entries={availableEndpoints}
                  selected={selectedToAdd}
                  alreadyInCollection={alreadyInCollection}
                  activeId={activeEndpointId}
                  onToggleSelected={workspaceActions.toggleEndpointSelection}
                  onChangeProjection={workspaceActions.closeProjection}
                  onViewDetail={onViewDetail}
                  onSave={onSave}
                  isSaving={isSaving}
                />
              </Panel>
              <ResizableHandle />
              <Panel>
                <EndpointDetailPanel
                  endpoint={activeEndpointDetail}
                  selected={activeEndpointId ? selectedToAdd.has(activeEndpointId) : false}
                  alreadyInCollection={
                    activeEndpointId ? alreadyInCollection.has(activeEndpointId) : false
                  }
                  onToggleSelected={workspaceActions.toggleEndpointSelection}
                />
              </Panel>
            </Group>
          )}
        </Panel>

        <ResizableHandle />

        <Panel defaultSize="20%" minSize="0%" maxSize="30%" collapsible>
          <div className="flex h-full flex-col gap-2">
            <div className="flex-initial overflow-hidden">
              <CollectionDetailsPanel collection={activeCollection} details={collectionDetails} />
            </div>
            <div className="flex-2 overflow-hidden">
              <CollectionEndpointsTree folders={folders} />
            </div>
          </div>
        </Panel>
      </Group>
    </div>
  );
}
