import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchCollectionDetails,
  fetchCollectionEndpoints,
  listCollections,
  selectCollection as selectCollectionOnServer,
} from '@/lib/api';
import { workspaceActions } from '@/lib/workspace-store';

export function useCollections(activeCollectionPath: string | undefined) {
  const queryClient = useQueryClient();

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: listCollections,
  });

  const endpointsQuery = useQuery({
    queryKey: ['collection-endpoints', activeCollectionPath],
    queryFn: () => fetchCollectionEndpoints(activeCollectionPath!),
    enabled: activeCollectionPath !== undefined,
  });

  const detailsQuery = useQuery({
    queryKey: ['collection-details', activeCollectionPath],
    queryFn: () => fetchCollectionDetails(activeCollectionPath!),
    enabled: activeCollectionPath !== undefined,
  });

  const selectMutation = useMutation({
    mutationFn: (path: string) => selectCollectionOnServer(path),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collections'] }),
  });

  useEffect(() => {
    if (!collectionsQuery.data) return;
    workspaceActions.setAvailableCollections(collectionsQuery.data.collections);
  }, [collectionsQuery.data]);

  useEffect(() => {
    if (!activeCollectionPath) return;
    selectMutation.mutate(activeCollectionPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCollectionPath]);

  return {
    folders: endpointsQuery.data?.folders ?? [],
    details: detailsQuery.data ?? null,
  };
}
