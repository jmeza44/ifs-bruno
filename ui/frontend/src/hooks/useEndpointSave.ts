import { useMutation, useQueryClient } from '@tanstack/react-query';
import { writeEndpoints } from '@/lib/api';
import type { SpecSource } from '@/lib/types';
import { workspaceActions } from '@/lib/workspace-store';
import { toast } from 'sonner';

interface SaveDeps {
  activeCollectionPath: string | undefined;
  profileName: string | null;
  projectionName: string | null;
  selectedIds: Set<string>;
  availableEntries: Array<{ id: string; path: string; method: string }>;
}

export function useEndpointSave({
  activeCollectionPath,
  profileName,
  projectionName,
  selectedIds,
  availableEntries,
}: SaveDeps) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeCollectionPath) throw new Error('No active collection');
      if (!profileName || !projectionName)
        throw new Error('No remote projection loaded to save endpoints from');

      const specSource: SpecSource = {
        kind: 'remote',
        profileName,
        projectionName,
      };

      const selected = availableEntries
        .filter((entry) => selectedIds.has(entry.id))
        .map((entry) => ({ path: entry.path, method: entry.method }));

      return writeEndpoints({ collectionPath: activeCollectionPath, source: specSource, selected });
    },
    onSuccess: () => {
      workspaceActions.saveSelection();
      queryClient.invalidateQueries({ queryKey: ['collection-endpoints', activeCollectionPath] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });

  function handleSave() {
    toast.promise(saveMutation.mutateAsync(), {
      loading: 'Saving endpoints...',
      success: 'Endpoints saved',
      error: (err) => `Failed to save: ${err.message}`,
    });
  }

  return {
    handleSave,
    isSaving: saveMutation.isPending,
  };
}
