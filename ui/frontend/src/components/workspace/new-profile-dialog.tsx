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
import { FieldGroup } from "@/components/ui/field";
import { HintField } from "@/components/workspace/hint-field";

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

          <FieldGroup>
            <HintField
              id="name"
              label="Name"
              value={form.name}
              onChange={(v) => set("name", v)}
              hint="A local alias for this connection, e.g. prod or staging"
            />
            <HintField
              id="host"
              label="Host"
              placeholder="https://acme.ifs.cloud"
              value={form.host}
              onChange={(v) => set("host", v)}
              hint="Base URL of your IFS Cloud environment, e.g. https://acme.ifs.cloud"
            />
            <HintField
              id="realm"
              label="Realm"
              value={form.realm}
              onChange={(v) => set("realm", v)}
              hint="Found in your Keycloak admin panel under Realms"
            />
            <HintField
              id="clientId"
              label="Client ID"
              value={form.clientId}
              onChange={(v) => set("clientId", v)}
              hint="Found in Keycloak → Clients, e.g. IFS_postman"
            />
            <HintField
              id="clientSecret"
              label="Client secret"
              type="password"
              value={form.clientSecret}
              onChange={(v) => set("clientSecret", v)}
              hint="Found in Keycloak → Clients → [client] → Credentials tab"
            />
          </FieldGroup>

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
