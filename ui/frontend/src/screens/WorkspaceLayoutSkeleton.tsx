import { useEffect, useRef, useState } from 'react';
import { WorkspaceTopBar } from '@/components/workspace/WorkspaceTopBar';
import { WorkspaceCanvas } from '@/components/workspace/WorkspaceCanvas';
import { ConfirmationDialog } from '@/components/workspace/confirmation-dialog';
import { SettingsDialog } from '@/components/workspace/settings-dialog';
import type { IfsProjection } from '@/lib/types';
import { useWorkspaceStore, workspaceActions } from '@/lib/workspace-store';
import { useCollections } from '@/hooks/useCollections';
import { useProfiles } from '@/hooks/useProfiles';
import { useProjection } from '@/hooks/useProjection';
import { useEndpointSave } from '@/hooks/useEndpointSave';
import type { ProfileOption } from '@/components/workspace/profile/profile-selector';

export function WorkspaceLayoutSkeleton() {
  const collection = useWorkspaceStore((state) => state.collection);
  const source = useWorkspaceStore((state) => state.source);
  const endpoints = useWorkspaceStore((state) => state.endpoints);
  const pendingConfirmation = useWorkspaceStore((state) => state.ui.pendingConfirmation);

  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchedProjection, setSearchedProjection] = useState<IfsProjection | null>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  const activeCollectionPath = collection.active?.path;
  const activeProfile = source.type === 'profile' ? source.profile : null;
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
    loadLocalSpec,
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

  function handleDeleteProfile(profile: ProfileOption) {
    if (workspaceActions.requestDeleteProfile(profile) === 'delete') {
      deleteProfile(profile);
    }
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <WorkspaceTopBar
        profileTriggerRef={profileTriggerRef}
        onLoadSpec={loadLocalSpec}
        newCollectionOpen={newCollectionOpen}
        onNewCollectionOpenChange={setNewCollectionOpen}
        newProfileOpen={newProfileOpen}
        onNewProfileOpenChange={setNewProfileOpen}
        onSettingsOpen={() => setSettingsOpen(true)}
        onDeleteProfile={handleDeleteProfile}
      />
      <WorkspaceCanvas
        collectionDetails={details}
        folders={folders}
        onAddProfile={() => setNewProfileOpen(true)}
        onFocusProfileSelector={() => {
          const trigger = profileTriggerRef.current;
          if (!trigger) return;
          trigger.focus();
          trigger.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
          );
        }}
        onLoadSpec={loadLocalSpec}
        onCreateCollection={() => setNewCollectionOpen(true)}
        searchedProjection={searchedProjection}
        onSelectSearchedProjection={setSearchedProjection}
        projections={projections}
        isLoadingProjections={isLoadingProjections}
        onContinueProjection={loadProjection}
        isLoadingProjection={isLoadingProjection}
        onViewDetail={viewEndpointDetail}
        onSave={handleSave}
        isSaving={isSaving}
      />
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
