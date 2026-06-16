import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, getPreferences, patchPreferences } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldGroup } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';

export type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const queryClient = useQueryClient();
  const [basePath, setBasePath] = useState('');
  const [error, setError] = useState<string | null>(null);

  const preferencesQuery = useQuery({
    queryKey: ['preferences'],
    queryFn: getPreferences,
  });

  useEffect(() => {
    if (!preferencesQuery.data) return;
    const stored = preferencesQuery.data.collectionsBasePath ?? '';
    setBasePath(stored.replace(/^~\//, ''));
  }, [preferencesQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      patchPreferences({
        collectionsBasePath: basePath.trim() ? `~/${basePath.trim()}` : '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      setError(err instanceof ApiError ? err.message : 'Failed to save preferences');
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) setError(null);
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="collections-base-path">Collections base path</Label>
              <InputGroup>
                <InputGroupAddon>~/</InputGroupAddon>
                <InputGroupInput
                  id="collections-base-path"
                  placeholder="Documents/Collections"
                  value={basePath}
                  onChange={(e) => setBasePath(e.target.value)}
                />
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                Bruno and Postman collections will be stored under separate subfolders here.
              </p>
            </div>
          </FieldGroup>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
