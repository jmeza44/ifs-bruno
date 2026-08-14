import { CollectionSelector } from '@/components/workspace/collection/collection-selector';
import {
  ProfileSelector,
  type ProfileOption,
} from '@/components/workspace/profile/profile-selector';
import { NewProfileDialog } from '@/components/workspace/profile/new-profile-dialog';
import { NewCollectionDialog } from '@/components/workspace/collection/new-collection-dialog';
import { SpecLoader } from '@/components/workspace/spec-loader';
import { Button } from '@/components/ui/button';
import { GearIcon } from '@phosphor-icons/react';
import type { CollectionEntry } from '@/lib/types';
import { useWorkspaceStore, workspaceActions } from '@/lib/workspace-store';

export type WorkspaceTopBarProps = {
  profileTriggerRef?: React.Ref<HTMLButtonElement>;
  onLoadSpec: (file: File) => void;
  newCollectionOpen: boolean;
  onNewCollectionOpenChange: (open: boolean) => void;
  newProfileOpen: boolean;
  onNewProfileOpenChange: (open: boolean) => void;
  onSettingsOpen: () => void;
  onDeleteProfile: (profile: ProfileOption) => void;
};

export function WorkspaceTopBar({
  profileTriggerRef,
  onLoadSpec,
  newCollectionOpen,
  onNewCollectionOpenChange,
  newProfileOpen,
  onNewProfileOpenChange,
  onSettingsOpen,
  onDeleteProfile,
}: WorkspaceTopBarProps) {
  const activeCollection = useWorkspaceStore((state) => state.collection.active);
  const availableCollections = useWorkspaceStore((state) => state.collection.available);
  const availableProfiles = useWorkspaceStore((state) => state.profiles.available);
  const source = useWorkspaceStore((state) => state.source);
  const activeProfile = source.type === 'profile' ? source.profile : null;
  const loadedSpec = source.type === 'spec' ? source.spec : null;

  return (
    <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border bg-card p-2">
      <CollectionSelector
        active={activeCollection}
        available={availableCollections}
        onSelect={workspaceActions.selectCollection}
        onCreateNew={() => onNewCollectionOpenChange(true)}
      />
      <NewCollectionDialog
        open={newCollectionOpen}
        onOpenChange={onNewCollectionOpenChange}
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
      <span className="text-sm font-heading font-semibold tracking-wide text-muted-foreground">
        {activeCollection?.format === 'postman' ? 'IFS Postman' : 'IFS Bruno'}
      </span>
      <div className="flex gap-2">
        <ProfileSelector
          ref={profileTriggerRef}
          active={activeProfile}
          available={availableProfiles}
          onSelect={workspaceActions.selectProfile}
          onDelete={onDeleteProfile}
          onAddNew={() => onNewProfileOpenChange(true)}
        />
        <NewProfileDialog
          open={newProfileOpen}
          onOpenChange={onNewProfileOpenChange}
          onCreated={(name) => workspaceActions.addProfile({ id: name, name, environment: '' })}
        />
        <SpecLoader loaded={loadedSpec} onLoad={onLoadSpec} onClear={workspaceActions.closeProjection} />
        <Button variant="outline" size="icon" title="Settings" onClick={onSettingsOpen}>
          <GearIcon size={18} />
        </Button>
      </div>
    </div>
  );
}
