import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, initCollection, type InitCollectionInput } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { HintField } from '@/components/workspace/shared/hint-field';

type Format = 'bruno' | 'postman';

const EMPTY_FORM: InitCollectionInput = {
  format: 'bruno',
  name: '',
  host: '',
  realm: '',
  clientId: '',
  workspaceId: '',
};

export type NewCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (path: string, format: Format) => void;
};

export function NewCollectionDialog({ open, onOpenChange, onCreated }: NewCollectionDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<InitCollectionInput>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (input: InitCollectionInput) => initCollection(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      onOpenChange(false);
      resetForm();
      onCreated?.(result.path, form.format);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({ name: 'A collection with this name already exists.' });
      } else {
        setError(err.message);
      }
    },
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setError(null);
    setFieldErrors({});
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function handleFormatChange(value: string) {
    if (value === 'bruno' || value === 'postman') {
      setForm((prev) => ({ ...prev, format: value }));
      setError(null);
      setFieldErrors({});
    }
  }

  function set<K extends keyof InitCollectionInput>(key: K, value: InitCollectionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    mutation.mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>
              Creates a local collection folder and stores the connection profile for it.
            </DialogDescription>
          </DialogHeader>

          <ToggleGroup
            type="single"
            value={form.format}
            onValueChange={handleFormatChange}
            variant="outline"
            spacing={2}
          >
            <ToggleGroupItem
              value="bruno"
              className="gap-1.5 data-[state=on]:border-bruno data-[state=on]:text-bruno"
            >
              <img src="/bruno-icon.svg" alt="" aria-hidden="true" className="size-4" />
              Bruno
            </ToggleGroupItem>
            <ToggleGroupItem
              value="postman"
              className="gap-1.5 data-[state=on]:border-postman data-[state=on]:text-postman"
            >
              <img src="/postman-icon.svg" alt="" aria-hidden="true" className="size-4" />
              Postman
            </ToggleGroupItem>
          </ToggleGroup>

          <FieldGroup>
            <HintField
              id="name"
              label="Collection name"
              placeholder="IFS"
              value={form.name}
              onChange={(v) => set('name', v)}
              hint="Name for the collection folder."
              error={fieldErrors.name}
            />
            <HintField
              id="host"
              label="Host"
              placeholder="https://acme.ifs.cloud"
              value={form.host}
              onChange={(v) => set('host', v)}
              hint="Base URL of your IFS Cloud environment."
              error={fieldErrors.host}
            />
            {form.format === 'postman' && (
              <HintField
                id="workspaceId"
                label="Workspace ID"
                placeholder="abc-123"
                value={form.workspaceId ?? ''}
                onChange={(v) => set('workspaceId', v)}
                hint="Your Postman workspace ID — found in the workspace settings URL."
                error={fieldErrors.workspaceId}
              />
            )}
            <HintField
              id="realm"
              label="Realm"
              placeholder="your-realm"
              value={form.realm}
              onChange={(v) => set('realm', v)}
              hint="Keycloak realm for this environment."
              error={fieldErrors.realm}
            />
            <HintField
              id="clientId"
              label="Client ID"
              placeholder="IFS_postman"
              value={form.clientId}
              onChange={(v) => set('clientId', v)}
              hint="OAuth2 client configured for API access."
              error={fieldErrors.clientId}
            />
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
