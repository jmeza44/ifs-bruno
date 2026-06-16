import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  initCollection,
  initPostmanCollection,
  type InitCollectionInput,
  type InitPostmanCollectionInput,
} from '@/lib/api';
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
import { HintField } from '@/components/workspace/hint-field';

type Format = 'bruno' | 'postman';

const EMPTY_BRUNO: InitCollectionInput = {
  name: '',
  host: '',
  realm: '',
  clientId: '',
};

const EMPTY_POSTMAN: InitPostmanCollectionInput = {
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
  const [format, setFormat] = useState<Format>('bruno');
  const [brunoForm, setBrunoForm] = useState<InitCollectionInput>(EMPTY_BRUNO);
  const [postmanForm, setPostmanForm] = useState<InitPostmanCollectionInput>(EMPTY_POSTMAN);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const brunoMutation = useMutation({
    mutationFn: (input: InitCollectionInput) => initCollection(input),
    onSuccess: (result) => handleSuccess(result.path),
    onError: handleError,
  });

  const postmanMutation = useMutation({
    mutationFn: (input: InitPostmanCollectionInput) => initPostmanCollection(input),
    onSuccess: (result) => handleSuccess(result.path),
    onError: handleError,
  });

  const isPending = brunoMutation.isPending || postmanMutation.isPending;

  function handleSuccess(path: string) {
    queryClient.invalidateQueries({ queryKey: ['collections'] });
    onOpenChange(false);
    resetForms();
    onCreated?.(path, format);
  }

  function handleError(err: Error) {
    if (err instanceof ApiError && err.fieldErrors) {
      setFieldErrors(err.fieldErrors);
    } else if (err instanceof ApiError && err.status === 409) {
      setFieldErrors({
        output: 'A collection already exists at that location. Choose a different output path.',
      });
    } else {
      setError(err.message);
    }
  }

  function resetForms() {
    setBrunoForm(EMPTY_BRUNO);
    setPostmanForm(EMPTY_POSTMAN);
    setError(null);
    setFieldErrors({});
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForms();
    onOpenChange(next);
  }

  function handleFormatChange(value: string) {
    if (value === 'bruno' || value === 'postman') {
      setFormat(value);
      setError(null);
      setFieldErrors({});
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (format === 'bruno') {
      brunoMutation.mutate(brunoForm);
    } else {
      postmanMutation.mutate(postmanForm);
    }
  }

  function setBruno<K extends keyof InitCollectionInput>(key: K, value: InitCollectionInput[K]) {
    setBrunoForm((prev) => ({ ...prev, [key]: value }));
  }

  function setPostman<K extends keyof InitPostmanCollectionInput>(
    key: K,
    value: InitPostmanCollectionInput[K],
  ) {
    setPostmanForm((prev) => ({ ...prev, [key]: value }));
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
            value={format}
            onValueChange={handleFormatChange}
            variant="outline"
            spacing={0}
          >
            <ToggleGroupItem value="bruno">Bruno</ToggleGroupItem>
            <ToggleGroupItem value="postman">Postman</ToggleGroupItem>
          </ToggleGroup>

          {format === 'bruno' ? (
            <FieldGroup>
              <HintField
                id="name"
                label="Collection name"
                placeholder="IFS"
                value={brunoForm.name}
                onChange={(v) => setBruno('name', v)}
                hint="Name or path for the collection folder (relative or absolute)."
                error={fieldErrors.name}
              />
              <HintField
                id="host"
                label="Host"
                placeholder="https://acme.ifs.cloud"
                value={brunoForm.host}
                onChange={(v) => setBruno('host', v)}
                hint="Base URL of your IFS Cloud environment."
                error={fieldErrors.host}
              />
              <HintField
                id="realm"
                label="Realm"
                placeholder="your-realm"
                value={brunoForm.realm}
                onChange={(v) => setBruno('realm', v)}
                hint="Found in your Keycloak admin panel under Realms."
                error={fieldErrors.realm}
              />
              <HintField
                id="clientId"
                label="Client ID"
                placeholder="IFS_postman"
                value={brunoForm.clientId}
                onChange={(v) => setBruno('clientId', v)}
                hint="OAuth2 client configured for API access."
                error={fieldErrors.clientId}
              />
            </FieldGroup>
          ) : (
            <FieldGroup>
              <HintField
                id="name"
                label="Collection name"
                placeholder="IFS"
                value={postmanForm.name}
                onChange={(v) => setPostman('name', v)}
                hint="Name for the Postman collection."
                error={fieldErrors.name}
              />
              <HintField
                id="host"
                label="Host"
                placeholder="https://acme.ifs.cloud"
                value={postmanForm.host}
                onChange={(v) => setPostman('host', v)}
                hint="Base URL of your IFS Cloud environment."
                error={fieldErrors.host}
              />
              <HintField
                id="workspaceId"
                label="Workspace ID"
                placeholder="abc-123"
                value={postmanForm.workspaceId}
                onChange={(v) => setPostman('workspaceId', v)}
                hint="Your Postman workspace ID — found in the workspace settings URL."
                error={fieldErrors.workspaceId}
              />
              <HintField
                id="realm"
                label="Realm"
                placeholder="your-realm"
                value={postmanForm.realm}
                onChange={(v) => setPostman('realm', v)}
                hint="Keycloak realm for this environment — used to build the token URL."
                error={fieldErrors.realm}
              />
              <HintField
                id="clientId"
                label="Client ID"
                placeholder="IFS_postman"
                value={postmanForm.clientId}
                onChange={(v) => setPostman('clientId', v)}
                hint="OAuth2 client configured for API access."
                error={fieldErrors.clientId}
              />
            </FieldGroup>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating…' : 'Create collection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
