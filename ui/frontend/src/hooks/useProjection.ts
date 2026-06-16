import { useMutation, useQuery } from '@tanstack/react-query';
import { fetchRemoteSpec, fetchSpecEntry, fetchProjections } from '@/lib/api';
import type { CollectionFolder, IfsProjection } from '@/lib/types';
import type { EndpointListEntry } from '@/components/workspace/endpoint-list-panel';
import { workspaceActions } from '@/lib/workspace-store';

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
      const endpoints: EndpointListEntry[] = spec.entries.map((entry) => ({
        id: `${entry.method.toUpperCase()}:${entry.path}`,
        path: entry.path,
        method: entry.method.toUpperCase(),
        summary: entry.summary,
        operationId: entry.operationId,
      }));
      const alreadyInCollection = buildAlreadyInCollectionKeys(folders);
      workspaceActions.selectProjection(projection, endpoints, alreadyInCollection);
    },
  });

  const viewEndpointDetailMutation = useMutation({
    mutationFn: async (entry: EndpointListEntry) => ({
      entry,
      detail: await fetchSpecEntry(entry.path, entry.method),
    }),
    onSuccess: ({ entry, detail }) =>
      workspaceActions.viewEndpointDetail({ ...detail, id: entry.id }),
  });

  return {
    projections: projectionsQuery.data?.projections ?? [],
    isLoadingProjections: projectionsQuery.isLoading,
    loadProjection: loadProjectionMutation.mutate,
    isLoadingProjection: loadProjectionMutation.isPending,
    viewEndpointDetail: (entry: EndpointListEntry) => {
      workspaceActions.viewEndpointDetail({
        id: entry.id,
        path: entry.path,
        method: entry.method,
        operationId: entry.operationId,
        summary: entry.summary,
      });
      viewEndpointDetailMutation.mutate(entry);
    },
  };
}
