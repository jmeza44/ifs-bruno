// Single-view workspace layout, wired to the global workspace store.

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Group, Panel, Separator } from "react-resizable-panels";
import { CollectionSelector } from "@/components/workspace/collection-selector";
import { ProfileSelector } from "@/components/workspace/profile-selector";
import { NewProfileDialog } from "@/components/workspace/new-profile-dialog";
import { NewCollectionDialog } from "@/components/workspace/new-collection-dialog";
import { CollectionDetailsPanel } from "@/components/workspace/collection-details-panel";
import { CollectionEndpointsTree } from "@/components/workspace/collection-endpoints-tree";
import { SpecLoader } from "@/components/workspace/spec-loader";
import { EndpointListPanel } from "@/components/workspace/endpoint-list-panel";
import { EndpointDetailPanel } from "@/components/workspace/endpoint-detail-panel";
import { ProjectionSearchPanel } from "@/components/workspace/projection-search-panel";
import { ConfirmationDialog } from "@/components/workspace/confirmation-dialog";
import { fetchCollectionDetails, fetchCollectionEndpoints, fetchProjections, fetchRemoteSpec, fetchSpecEntry, listCollections, listProfiles, selectCollection as selectCollectionOnServer, writeEndpoints } from "@/lib/api";
import type { CollectionEntry, CollectionFolder, IfsProjection, SpecSource } from "@/lib/types";
import type { EndpointListEntry } from "@/components/workspace/endpoint-list-panel";
import { useWorkspaceStore, workspaceActions } from "@/lib/workspace-store";

function buildAlreadyInCollectionKeys(folders: CollectionFolder[]): Set<string> {
  const keys = new Set<string>();
  for (const folder of folders) {
    for (const endpoint of folder.endpoints) {
      if (endpoint.path === null) continue;
      keys.add(`${endpoint.method}:${endpoint.path}`);
    }
  }
  return keys;
}

export function WorkspaceLayoutSkeleton() {
  const collection = useWorkspaceStore((state) => state.collection);
  const profiles = useWorkspaceStore((state) => state.profiles);
  const source = useWorkspaceStore((state) => state.source);
  const endpoints = useWorkspaceStore((state) => state.endpoints);
  const pendingConfirmation = useWorkspaceStore((state) => state.ui.pendingConfirmation);

  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [searchedProjection, setSearchedProjection] = useState<IfsProjection | null>(null);

  const queryClient = useQueryClient();

  const collectionsQuery = useQuery({ queryKey: ["collections"], queryFn: listCollections });
  const profilesQuery = useQuery({ queryKey: ["profiles"], queryFn: listProfiles });

  const selectCollectionMutation = useMutation({
    mutationFn: (path: string) => selectCollectionOnServer(path),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collections"] }),
  });

  const activeCollectionPath = collection.active?.path;
  const collectionEndpointsQuery = useQuery({
    queryKey: ["collection-endpoints", activeCollectionPath],
    queryFn: () => fetchCollectionEndpoints(activeCollectionPath!),
    enabled: activeCollectionPath !== undefined,
  });
  const collectionDetailsQuery = useQuery({
    queryKey: ["collection-details", activeCollectionPath],
    queryFn: () => fetchCollectionDetails(activeCollectionPath!),
    enabled: activeCollectionPath !== undefined,
  });

  const loadProjectionMutation = useMutation({
    mutationFn: async (projection: IfsProjection) => {
      if (source.type !== "profile") throw new Error("No active profile");
      const spec = await fetchRemoteSpec(source.profile.name, projection.ProjectionName);
      return { projection, spec };
    },
    onSuccess: ({ projection, spec }) => {
      const endpoints: EndpointListEntry[] = spec.entries.map((entry) => ({
        id: `${entry.method.toUpperCase()}:${entry.path}`,
        path: entry.path,
        method: entry.method.toUpperCase(),
        summary: entry.summary,
        operationId: entry.operationId,
      }));
      const alreadyInCollection = buildAlreadyInCollectionKeys(collectionEndpointsQuery.data?.folders ?? []);
      workspaceActions.selectProjection(projection, endpoints, alreadyInCollection);
    },
  });

  const viewEndpointDetailMutation = useMutation({
    mutationFn: async (entry: EndpointListEntry) => ({
      entry,
      detail: await fetchSpecEntry(entry.path, entry.method),
    }),
    onSuccess: ({ entry, detail }) => workspaceActions.viewEndpointDetail({ ...detail, id: entry.id }),
  });

  const saveSelectionMutation = useMutation({
    mutationFn: async () => {
      if (!activeCollectionPath) throw new Error("No active collection");

      if (!(source.type === "profile" && source.projection.state === "resolved")) {
        throw new Error("No remote projection loaded to save endpoints from");
      }
      const specSource: SpecSource = {
        kind: "remote",
        profileName: source.profile.name,
        projectionName: source.projection.projection.ProjectionName,
      };

      const selected = endpoints.available
        .filter((entry) => endpoints.selectedToAdd.has(entry.id))
        .map((entry) => ({ path: entry.path, method: entry.method }));

      return writeEndpoints({ collectionPath: activeCollectionPath, source: specSource, selected });
    },
    onSuccess: () => {
      workspaceActions.saveSelection();
      queryClient.invalidateQueries({ queryKey: ["collection-endpoints", activeCollectionPath] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });

  useEffect(() => {
    if (!collectionsQuery.data) return;
    workspaceActions.setAvailableCollections(collectionsQuery.data.collections);
  }, [collectionsQuery.data]);

  useEffect(() => {
    if (!profilesQuery.data) return;
    workspaceActions.setAvailableProfiles(
      profilesQuery.data.profiles.map((profile) => ({ id: profile.name, name: profile.name, environment: profile.host })),
    );
  }, [profilesQuery.data]);

  useEffect(() => {
    if (!activeCollectionPath) return;
    selectCollectionMutation.mutate(activeCollectionPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCollectionPath]);

  const activeProfile = source.type === "profile" ? source.profile : null;
  const loadedSpec = source.type === "spec" ? source.spec : null;
  const isSearchingProjection = source.type === "profile" && source.projection.state === "searching";

  const projectionsQuery = useQuery({
    queryKey: ["projections", activeProfile?.name],
    queryFn: () => fetchProjections(activeProfile!.name),
    enabled: isSearchingProjection && activeProfile !== null,
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
          onCreated={(path) => {
            const entry: CollectionEntry = {
              path,
              name: path.split(/[\\/]/).pop() ?? path,
              baseHost: null,
              endpointCount: 0,
              lastUsed: new Date().toISOString(),
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
            onDelete={workspaceActions.deleteProfile}
            onAddNew={() => setNewProfileOpen(true)}
          />
          <NewProfileDialog
            open={newProfileOpen}
            onOpenChange={setNewProfileOpen}
            onCreated={(name) => workspaceActions.addProfile({ id: name, name, environment: "" })}
          />
          <SpecLoader loaded={loadedSpec} onLoad={() => {}} onClear={workspaceActions.closeProjection} />
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
                projections={projectionsQuery.data?.projections ?? []}
                isLoading={projectionsQuery.isLoading}
                selected={searchedProjection}
                onSelect={setSearchedProjection}
                onContinue={(projection) => loadProjectionMutation.mutate(projection)}
                isContinuing={loadProjectionMutation.isPending}
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
                    onViewDetail={(entry) => {
                      workspaceActions.viewEndpointDetail({
                        id: entry.id,
                        path: entry.path,
                        method: entry.method,
                        operationId: entry.operationId,
                        summary: entry.summary,
                      });
                      viewEndpointDetailMutation.mutate(entry);
                    }}
                    onSave={() => saveSelectionMutation.mutate()}
                    isSaving={saveSelectionMutation.isPending}
                  />
                </Panel>
                <Separator className="w-px bg-border transition-colors hover:bg-primary/50 data-active:bg-primary" />
                <Panel>
                  <EndpointDetailPanel
                    endpoint={endpoints.detail}
                    selected={activeEndpointId ? endpoints.selectedToAdd.has(activeEndpointId) : false}
                    alreadyInCollection={activeEndpointId ? endpoints.alreadyInCollection.has(activeEndpointId) : false}
                    onToggleSelected={workspaceActions.toggleEndpointSelection}
                  />
                </Panel>
              </Group>
            )}
          </Panel>

          <Separator className="w-px bg-border transition-colors hover:bg-primary/50 data-active:bg-primary" />

          {/* Right sidebar — collapsible down to 0 */}
          <Panel defaultSize="20%" minSize="0%" maxSize="30%" collapsible>
            <div className="flex h-full flex-col gap-2">
              <div className="flex-initial overflow-hidden">
                <CollectionDetailsPanel collection={collection.active} details={collectionDetailsQuery.data ?? null} />
              </div>
              <div className="flex-2 overflow-hidden">
                <CollectionEndpointsTree folders={collectionEndpointsQuery.data?.folders ?? []} />
              </div>
            </div>
          </Panel>
        </Group>
      </div>

      <ConfirmationDialog
        pending={pendingConfirmation}
        selectedCount={endpoints.selectedToAdd.size}
        onConfirm={workspaceActions.confirmPending}
        onCancel={workspaceActions.cancelPending}
      />
    </div>
  );
}
