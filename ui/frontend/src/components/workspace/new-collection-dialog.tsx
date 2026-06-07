import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, initCollection, type InitCollectionInput } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY_FORM: InitCollectionInput = {
  name: "",
  host: "",
  realm: "",
  clientId: "",
  output: "",
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

  const mutation = useMutation({
    mutationFn: (input: InitCollectionInput) => initCollection(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      onOpenChange(false);
      setForm(EMPTY_FORM);
      setError(null);
      onCreated?.(result.path);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 409) {
        setError(`A collection already exists at that location. Choose a different output path.`);
      } else {
        setError(err.message);
      }
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(EMPTY_FORM);
      setError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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

          <div className="space-y-3">
            <Field id="name" label="Collection name" placeholder="IFS" value={form.name} onChange={(v) => set("name", v)} />
            <Field
              id="host"
              label="Host"
              placeholder="https://acme.ifs.cloud"
              value={form.host}
              onChange={(v) => set("host", v)}
            />
            <Field id="realm" label="Realm" placeholder="your-realm" value={form.realm} onChange={(v) => set("realm", v)} />
            <Field id="clientId" label="Client ID" placeholder="IFS_postman" value={form.clientId} onChange={(v) => set("clientId", v)} />
            <Field
              id="output"
              label="Output folder (optional)"
              placeholder={form.name || "defaults to collection name"}
              value={form.output ?? ""}
              onChange={(v) => set("output", v)}
              required={false}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
