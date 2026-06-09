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
import { HintField } from '@/components/workspace/hint-field';

const EMPTY_FORM: InitCollectionInput = {
  name: '',
  host: '',
  realm: '',
  clientId: '',
  output: '',
};

export type NewCollectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (path: string) => void;
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
      setForm(EMPTY_FORM);
      setError(null);
      setFieldErrors({});
      onCreated?.(result.path);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError && err.status === 409) {
        setFieldErrors({
          output: 'A collection already exists at that location. Choose a different output path.',
        });
      } else {
        setError(err.message);
      }
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(EMPTY_FORM);
      setError(null);
      setFieldErrors({});
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const output = form.output?.trim() || undefined;
    mutation.mutate({ ...form, output });
  }

  function set<K extends keyof InitCollectionInput>(key: K, value: InitCollectionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

          <FieldGroup>
            <HintField
              id="name"
              label="Collection name"
              placeholder="IFS"
              value={form.name}
              onChange={(v) => set('name', v)}
              hint="Name or path for the collection folder (relative or absolute). A simple name like IFS creates ./IFS; a path like collections/IFS creates that subfolder."
              error={fieldErrors.name}
            />
            <HintField
              id="host"
              label="Host"
              placeholder="https://acme.ifs.cloud"
              value={form.host}
              onChange={(v) => set('host', v)}
              hint="Base URL of your IFS Cloud environment, e.g. https://acme.ifs.cloud"
              error={fieldErrors.host}
            />
            <HintField
              id="realm"
              label="Realm"
              placeholder="your-realm"
              value={form.realm}
              onChange={(v) => set('realm', v)}
              hint="Found in your Keycloak admin panel under Realms, usually matches your environment name"
              error={fieldErrors.realm}
            />
            <HintField
              id="clientId"
              label="Client ID"
              placeholder="IFS_postman"
              value={form.clientId}
              onChange={(v) => set('clientId', v)}
              hint="OAuth2 client configured for API access, e.g. IFS_postman"
              error={fieldErrors.clientId}
            />
            <HintField
              id="output"
              label="Output folder"
              placeholder={form.name || 'defaults to collection name'}
              value={form.output ?? ''}
              onChange={(v) => set('output', v)}
              required={false}
              hint="Optional · Defaults to the collection name when left empty"
              error={fieldErrors.output}
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
