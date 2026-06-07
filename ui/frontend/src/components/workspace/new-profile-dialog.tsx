import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfile, type ProfileInput } from "@/lib/api";
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

const EMPTY_FORM: ProfileInput = {
  name: "",
  host: "",
  realm: "",
  clientId: "",
  clientSecret: "",
};

export type NewProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (name: string) => void;
};

export function NewProfileDialog({ open, onOpenChange, onCreated }: NewProfileDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileInput>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (input: ProfileInput) => createProfile(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      onOpenChange(false);
      setForm(EMPTY_FORM);
      setFormError(null);
      onCreated?.(result.name);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setForm(EMPTY_FORM);
      setFormError(null);
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate(form);
  }

  function set<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New profile</DialogTitle>
            <DialogDescription>
              Credentials are stored locally in ~/.ifs-bruno/config.json and never leave this machine.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Field id="name" label="Name" value={form.name} onChange={(v) => set("name", v)} />
            <Field
              id="host"
              label="Host"
              placeholder="https://acme.ifs.cloud"
              value={form.host}
              onChange={(v) => set("host", v)}
            />
            <Field id="realm" label="Realm" value={form.realm} onChange={(v) => set("realm", v)} />
            <Field id="clientId" label="Client ID" value={form.clientId} onChange={(v) => set("clientId", v)} />
            <Field
              id="clientSecret"
              label="Client secret"
              type="password"
              value={form.clientSecret}
              onChange={(v) => set("clientSecret", v)}
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving…" : "Save"}
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
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
