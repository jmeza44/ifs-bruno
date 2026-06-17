import { CollectionSelector } from '@/components/workspace/collection-selector';
import { ProfileSelector, type ProfileOption } from '@/components/workspace/profile-selector';
import { NewProfileDialog } from '@/components/workspace/new-profile-dialog';
import { NewCollectionDialog } from '@/components/workspace/new-collection-dialog';
import { SpecLoader } from '@/components/workspace/spec-loader';
import { Button } from '@/components/ui/button';
import { GearIcon } from '@phosphor-icons/react';
import type { CollectionEntry, LoadedSpec } from '@/lib/types';
import { workspaceActions } from '@/lib/workspace-store';

export type WorkspaceTopBarProps = {
  activeCollection: CollectionEntry | null;
  availableCollections: CollectionEntry[];
  activeProfile: ProfileOption | null;
  availableProfiles: ProfileOption[];
  loadedSpec: LoadedSpec | null;
  newCollectionOpen: boolean;
  onNewCollectionOpenChange: (open: boolean) => void;
  newProfileOpen: boolean;
  onNewProfileOpenChange: (open: boolean) => void;
  onSettingsOpen: () => void;
  onDeleteProfile: (profile: ProfileOption) => void;
};

export function WorkspaceTopBar({
  activeCollection,
  availableCollections,
  activeProfile,
  availableProfiles,
  loadedSpec,
  newCollectionOpen,
  onNewCollectionOpenChange,
  newProfileOpen,
  onNewProfileOpenChange,
  onSettingsOpen,
  onDeleteProfile,
}: WorkspaceTopBarProps) {
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
      <span className="text-sm font-semibold tracking-wide text-muted-foreground">
        {activeCollection?.format === 'postman' ? 'IFS Postman' : 'IFS Bruno'}
      </span>
      <div className="flex gap-2">
        <ProfileSelector
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
        <SpecLoader
          loaded={loadedSpec}
          onLoad={() => {}}
          onClear={workspaceActions.closeProjection}
        />
        <Button variant="outline" size="icon" title="Settings" onClick={onSettingsOpen}>
          <GearIcon size={18} />
        </Button>
      </div>
    </div>
  );
}
