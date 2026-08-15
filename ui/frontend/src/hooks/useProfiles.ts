import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteProfile as deleteProfileOnServer, listProfiles } from '@/lib/api';
import type { ProfileOption } from '@/lib/types';
import { workspaceActions } from '@/lib/workspace-store';
import { toast } from 'sonner';

export function useProfiles() {
  const queryClient = useQueryClient();

  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: listProfiles,
  });

  const deleteMutation = useMutation({
    mutationFn: (profile: ProfileOption) => deleteProfileOnServer(profile.name),
    onSuccess: (_result, profile) => {
      workspaceActions.removeProfile(profile);
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (err) => toast.error(`Failed to delete profile: ${err.message}`),
  });

  useEffect(() => {
    if (!profilesQuery.data) return;
    workspaceActions.setAvailableProfiles(
      profilesQuery.data.profiles.map((profile) => ({
        id: profile.name,
        name: profile.name,
        environment: profile.host,
      })),
    );
  }, [profilesQuery.data]);

  return {
    deleteProfile: deleteMutation.mutate,
    isLoadingProfiles: profilesQuery.isLoading,
  };
}
