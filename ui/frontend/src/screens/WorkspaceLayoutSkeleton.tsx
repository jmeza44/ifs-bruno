import { useEffect, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { CollectionSelector } from '@/components/workspace/collection-selector';
import { ProfileSelector, type ProfileOption } from '@/components/workspace/profile-selector';
import { NewProfileDialog } from '@/components/workspace/new-profile-dialog';
import { NewCollectionDialog } from '@/components/workspace/new-collection-dialog';
import { CollectionDetailsPanel } from '@/components/workspace/collection-details-panel';
import { CollectionEndpointsTree } from '@/components/workspace/collection-endpoints-tree';
import { SpecLoader } from '@/components/workspace/spec-loader';
import { EndpointListPanel } from '@/components/workspace/endpoint-list-panel';
import { EndpointDetailPanel } from '@/components/workspace/endpoint-detail-panel';
import { ProjectionSearchPanel } from '@/components/workspace/projection-search-panel';
import { ConfirmationDialog } from '@/components/workspace/confirmation-dialog';
import { SettingsDialog } from '@/components/workspace/settings-dialog';
import type { CollectionEntry, IfsProjection } from '@/lib/types';
import { useWorkspaceStore, workspaceActions } from '@/lib/workspace-store';
import { useCollections } from '@/hooks/useCollections';
import { useProfiles } from '@/hooks/useProfiles';
import { useProjection } from '@/hooks/useProjection';
import { useEndpointSave } from '@/hooks/useEndpointSave';
import { DotsSixVerticalIcon, GearIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

export function WorkspaceLayoutSkeleton() {
  const collection = useWorkspaceStore((state) => state.collection);
  const profiles = useWorkspaceStore((state) => state.profiles);
  const source = useWorkspaceStore((state) => state.source);
  const endpoints = useWorkspaceStore((state) => state.endpoints);
  const pendingConfirmation = useWorkspaceStore((state) => state.ui.pendingConfirmation);

  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchedProjection, setSearchedProjection] = useState<IfsProjection | null>(null);

  const activeCollectionPath = collection.active?.path;
  const activeProfile = source.type === 'profile' ? source.profile : null;
  const loadedSpec = source.type === 'spec' ? source.spec : null;
  const isSearchingProjection =
    source.type === 'profile' && source.projection.state === 'searching';
  const resolvedProjection =
    source.type === 'profile' && source.projection.state === 'resolved'
      ? source.projection.projection
      : null;

  const { folders, details } = useCollections(activeCollectionPath);
  const { deleteProfile } = useProfiles();
  const {
    projections,
    isLoadingProjections,
    loadProjection,
    isLoadingProjection,
    viewEndpointDetail,
  } = useProjection(activeProfile?.name ?? null, isSearchingProjection, folders);
  const { handleSave, isSaving } = useEndpointSave({
    activeCollectionPath,
    profileName: activeProfile?.name ?? null,
    projectionName: resolvedProjection?.ProjectionName ?? null,
    selectedIds: endpoints.selectedToAdd,
    availableEntries: endpoints.available,
  });

  useEffect(() => {
    setSearchedProjection(null);
  }, [activeProfile?.name]);

  const activeEndpointId = endpoints.detail?.id;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-card p-2">
        <CollectionSelector
          active={collection.active}
          available={collection.available}
          onSelect={workspaceActions.selectCollection}
          onCreateNew={() => setNewCollectionOpen(true)}
        />
        <NewCollectionDialog
          open={newCollectionOpen}
          onOpenChange={setNewCollectionOpen}
          onCreated={(path, format) => {
            const entry: CollectionEntry = {
              path,
              name: path.split(/[\\/]/).pop() ?? path,
              baseHost: null,
              endpointCount: 0,
              lastUsed: new Date().toISOString(),
              format,
            };
            workspaceActions.createCollection(entry);
          }}
        />
        <span className="text-sm font-semibold tracking-wide text-muted-foreground">IFS Bruno</span>
        <div className="flex gap-2">
          <ProfileSelector
            active={activeProfile}
            available={profiles.available}
            onSelect={workspaceActions.selectProfile}
            onDelete={(profile: ProfileOption) => {
              if (workspaceActions.requestDeleteProfile(profile) === 'delete') {
                deleteProfile(profile);
              }
            }}
            onAddNew={() => setNewProfileOpen(true)}
          />
          <NewProfileDialog
            open={newProfileOpen}
            onOpenChange={setNewProfileOpen}
            onCreated={(name) => workspaceActions.addProfile({ id: name, name, environment: '' })}
          />
          <SpecLoader
            loaded={loadedSpec}
            onLoad={() => {}}
            onClear={workspaceActions.closeProjection}
          />
          <Button
            variant="outline"
            size="icon"
            title="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <GearIcon size={18} />
          </Button>
        </div>
      </div>

      {/* Canvas body */}
      <div className="min-h-0 flex-1 p-2 relative">
        <Group className="gap-x-2">
          {/* Main panel */}
          <Panel className="flex gap-2">
            {isSearchingProjection && activeProfile ? (
              <ProjectionSearchPanel
                profileName={activeProfile.name}
                projections={projections}
                isLoading={isLoadingProjections}
                selected={searchedProjection}
                onSelect={setSearchedProjection}
                onContinue={(projection) => loadProjection(projection)}
                isContinuing={isLoadingProjection}
              />
            ) : (
              <Group className="gap-x-2">
                <Panel defaultSize="30%" minSize="30%" maxSize="50%">
                  <EndpointListPanel
                    entries={endpoints.available}
                    selected={endpoints.selectedToAdd}
                    alreadyInCollection={endpoints.alreadyInCollection}
                    activeId={activeEndpointId}
                    onToggleSelected={workspaceActions.toggleEndpointSelection}
                    onChangeProjection={workspaceActions.closeProjection}
                    onViewDetail={viewEndpointDetail}
                    onSave={handleSave}
                    isSaving={isSaving}
                  />
                </Panel>
                <Separator className="group relative w-px bg-transparent transition-colors hover:bg-border data-active:bg-primary h-full">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 px-0.5 bg-muted rounded-lg overflow-hidden opacity-0 transition-opacity group-hover:opacity-100">
                    <DotsSixVerticalIcon
                      size={12}
                      className="pointer-events-none text-muted-foreground"
                    />
                  </div>
                </Separator>
                <Panel>
                  <EndpointDetailPanel
                    endpoint={endpoints.detail}
                    selected={
                      activeEndpointId ? endpoints.selectedToAdd.has(activeEndpointId) : false
                    }
                    alreadyInCollection={
                      activeEndpointId ? endpoints.alreadyInCollection.has(activeEndpointId) : false
                    }
                    onToggleSelected={workspaceActions.toggleEndpointSelection}
                  />
                </Panel>
              </Group>
            )}
          </Panel>

          <Separator className="group relative w-px bg-transparent transition-colors hover:bg-border data-active:bg-primary h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 px-0.5 bg-muted rounded-lg overflow-hidden opacity-0 transition-opacity group-hover:opacity-100">
              <DotsSixVerticalIcon
                size={12}
                className="pointer-events-none text-muted-foreground"
              />
            </div>
          </Separator>

          {/* Right sidebar — collapsible down to 0 */}
          <Panel defaultSize="20%" minSize="0%" maxSize="30%" collapsible>
            <div className="flex h-full flex-col gap-2">
              <div className="flex-initial overflow-hidden">
                <CollectionDetailsPanel collection={collection.active} details={details} />
              </div>
              <div className="flex-2 overflow-hidden">
                <CollectionEndpointsTree folders={folders} />
              </div>
            </div>
          </Panel>
        </Group>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <ConfirmationDialog
        pending={pendingConfirmation}
        selectedCount={endpoints.selectedToAdd.size}
        onConfirm={() => {
          if (pendingConfirmation?.type === 'delete-active-profile') {
            deleteProfile(pendingConfirmation.target);
            return;
          }
          workspaceActions.confirmPending();
        }}
        onCancel={workspaceActions.cancelPending}
      />
    </div>
  );
}
