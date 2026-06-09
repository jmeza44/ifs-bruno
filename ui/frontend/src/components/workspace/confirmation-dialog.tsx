import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { PendingConfirmation } from '@/lib/types';

export type { PendingConfirmation };

export type ConfirmationDialogProps = {
  pending: PendingConfirmation | null;
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
};

type ConfirmationCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
};

function describe(pending: PendingConfirmation, selectedCount: number): ConfirmationCopy {
  const isDirty = selectedCount > 0;
  const unsavedNote = isDirty
    ? ` You have ${selectedCount} endpoint${selectedCount === 1 ? '' : 's'} selected that ${
        selectedCount === 1 ? "hasn't" : "haven't"
      } been saved — switching now will discard ${selectedCount === 1 ? 'it' : 'them'}.`
    : '';

  switch (pending.type) {
    case 'switch-collection':
      return {
        title: 'Switch collection?',
        description: `Switching to "${pending.target.name}" will close the current projection and clear the endpoint list.${unsavedNote}`,
        confirmLabel: 'Switch collection',
      };

    case 'create-collection-and-move':
      return {
        title: 'Move to new collection?',
        description: `"${pending.created.name}" was created and is ready to use. Moving to it will close the current projection and clear the endpoint list.${unsavedNote}`,
        confirmLabel: 'Switch to new collection',
      };

    case 'switch-profile':
      return {
        title: 'Switch profile?',
        description: `Switching to "${pending.target.name}" will close the current projection and reset the endpoint search.${unsavedNote}`,
        confirmLabel: 'Switch profile',
      };

    case 'delete-active-profile':
      return {
        title: 'Delete active profile?',
        description: isDirty
          ? `"${pending.target.name}" is the active profile and you have ${selectedCount} endpoint${
              selectedCount === 1 ? '' : 's'
            } selected that ${
              selectedCount === 1 ? "hasn't" : "haven't"
            } been saved. Deleting it will discard ${
              selectedCount === 1 ? 'it' : 'them'
            } and clear the current projection. This cannot be undone.`
          : `"${pending.target.name}" is the active profile. Deleting it will clear the current projection. This cannot be undone.`,
        confirmLabel: 'Delete profile',
        destructive: true,
      };

    case 'switch-source':
      return {
        title:
          pending.target === 'spec' ? 'Load a spec file instead?' : 'Switch to a profile instead?',
        description:
          pending.target === 'spec'
            ? `Loading a spec file will replace the active profile-based projection and clear the endpoint list.${unsavedNote}`
            : `Selecting a profile will replace the loaded spec file and clear the endpoint list.${unsavedNote}`,
        confirmLabel: pending.target === 'spec' ? 'Load spec file' : 'Switch to profile',
      };
  }
}

export function ConfirmationDialog({
  pending,
  selectedCount,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const copy = pending ? describe(pending, selectedCount) : null;

  return (
    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && onCancel()}>
      {copy && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={copy.destructive ? 'destructive' : 'default'}
              onClick={onConfirm}
            >
              {copy.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
