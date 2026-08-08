import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef } from 'react';
import { fetchRemoteSpec, fetchSpecEntry, fetchProjections, uploadSpec } from '@/lib/api';
import type { CollectionFolder, IfsProjection, SpecResult } from '@/lib/types';
import type { EndpointListEntry } from '@/components/workspace/endpoint/endpoint-list-panel';
import { workspaceActions } from '@/lib/workspace-store';

function toEndpointListEntries(entries: SpecResult['entries']): EndpointListEntry[] {
  return entries.map((entry) => ({
    id: `${entry.method.toUpperCase()}:${entry.path}`,
    path: entry.path,
    method: entry.method.toUpperCase(),
    summary: entry.summary,
    operationId: entry.operationId,
    tier: entry.tier,
  }));
}

// Debounces the detail fetch when the user is navigating quickly (e.g. holding an
// arrow key), so we don't fire one HTTP request per keydown — only once the
// selection settles. The row highlight and any already-known data still update
// synchronously on every step.
const VIEW_DETAIL_DEBOUNCE_MS = 150;

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

export function useProjection(
  activeProfileName: string | null,
  isSearching: boolean,
  folders: CollectionFolder[],
) {
  const projectionsQuery = useQuery({
    queryKey: ['projections', activeProfileName],
    queryFn: () => fetchProjections(activeProfileName!),
    enabled: isSearching && activeProfileName !== null,
  });

  const loadProjectionMutation = useMutation({
    mutationFn: async (projection: IfsProjection) => {
      if (!activeProfileName) throw new Error('No active profile');
      const spec = await fetchRemoteSpec(activeProfileName, projection.ProjectionName);
      return { projection, spec };
    },
    onSuccess: ({ projection, spec }) => {
      const endpoints = toEndpointListEntries(spec.entries);
      const alreadyInCollection = buildAlreadyInCollectionKeys(folders);
      workspaceActions.selectProjection(projection, endpoints, alreadyInCollection);
    },
  });

  const loadLocalSpecMutation = useMutation({
    mutationFn: async (file: File) => {
      const content = await file.text();
      const spec = await uploadSpec(file.name, content);
      return { file, spec };
    },
    onSuccess: ({ file, spec }) => {
      const endpoints = toEndpointListEntries(spec.entries);
      const projection: IfsProjection = {
        ProjectionName: spec.specTitle,
        Name: spec.specTitle,
        Description: null,
        Categories: null,
        Component: null,
        ApiClass: null,
        Layer: null,
        Deprecated: null,
      };
      workspaceActions.loadSpec({ fileName: file.name, projectionName: spec.specTitle }, projection, endpoints);
    },
  });

  const viewEndpointDetailMutation = useMutation({
    mutationFn: async (entry: EndpointListEntry) => ({
      entry,
      detail: await fetchSpecEntry(entry.path, entry.method),
    }),
    onSuccess: ({ entry, detail }) => {
      // A slower, older request can resolve after a newer one — ignore it if the
      // user has since moved on to a different endpoint.
      if (entry.id !== latestRequestedIdRef.current) return;
      workspaceActions.viewEndpointDetail({ ...detail, id: entry.id });
    },
  });

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRequestedIdRef = useRef<string | null>(null);

  return {
    projections: projectionsQuery.data?.projections ?? [],
    isLoadingProjections: projectionsQuery.isLoading,
    loadProjection: loadProjectionMutation.mutate,
    isLoadingProjection: loadProjectionMutation.isPending,
    loadLocalSpec: loadLocalSpecMutation.mutate,
    isLoadingLocalSpec: loadLocalSpecMutation.isPending,
    viewEndpointDetail: (entry: EndpointListEntry) => {
      // Lightweight — updates only which row is highlighted, so this is instant
      // even while holding an arrow key. The (heavier) full detail payload is
      // fetched separately, debounced below.
      workspaceActions.setActiveEndpointId(entry.id);

      latestRequestedIdRef.current = entry.id;
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        viewEndpointDetailMutation.mutate(entry);
      }, VIEW_DETAIL_DEBOUNCE_MS);
    },
  };
}
