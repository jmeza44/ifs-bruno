import { FolderIcon } from "@phosphor-icons/react";
import type { CollectionEntry } from "@/lib/types";

export type CollectionDetails = {
  realm: string;
  clientId: string;
  keycloakBasePath: string;
};

export type CollectionDetailsPanelProps = {
  collection: CollectionEntry | null;
  details: CollectionDetails | null;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono" title={value}>
        {value}
      </span>
    </div>
  );
}

export function CollectionDetailsPanel({
  collection,
  details,
}: CollectionDetailsPanelProps) {
  if (!collection || !details) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 rounded-none border border-border p-4 text-center text-xs text-muted-foreground">
        <FolderIcon size={20} />
        <span>Select a collection to see its details</span>
      </div>
    );
  }

  return (
    <div className="scroll-discreet flex flex-col gap-3 overflow-y-auto rounded-none border border-border p-3">
      <div className="space-y-1">
        <p className="truncate text-sm font-semibold" title={collection.name}>
          {collection.name}
        </p>
        <p
          className="truncate font-mono text-xs text-muted-foreground"
          title={collection.path}
        >
          {collection.path}
        </p>
      </div>

      <Section title="Connection">
        <Row label="Base host" value={collection.baseHost ?? "—"} />
        <Row label="Realm" value={details.realm} />
        <Row label="Client ID" value={details.clientId} />
        <Row label="Keycloak path" value={details.keycloakBasePath} />
      </Section>
    </div>
  );
}
