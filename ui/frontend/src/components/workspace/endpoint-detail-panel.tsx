import { CheckSquareIcon, SquareIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { methodTextStyle } from "@/lib/http-method-styles";
import { cn } from "@/lib/utils";

export type EndpointDetailParameter = {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  type?: string;
  enum?: string[];
  example?: unknown;
  schema?: unknown;
};

export type EndpointDetailResponse = {
  status: string;
  description?: string;
  schema?: unknown;
};

export type EndpointDetail = {
  id: string;
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  produces?: string[];
  parameters?: EndpointDetailParameter[];
  responses?: EndpointDetailResponse[];
};

export type EndpointDetailPanelProps = {
  endpoint: EndpointDetail | null;
  selected?: boolean;
  alreadyInCollection?: boolean;
  onToggleSelected?: (id: string) => void;
};

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

function LinkedText({ text, className }: { text: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  MARKDOWN_LINK_PATTERN.lastIndex = 0;
  while ((match = MARKDOWN_LINK_PATTERN.exec(text)) !== null) {
    const [full, label, url] = match;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a
        key={`${url}-${match.index}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-sky-600 underline decoration-dotted underline-offset-2 hover:text-sky-500 dark:text-sky-400"
      >
        {label}
      </a>
    );
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <span className={className}>{parts}</span>;
}

function Section({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5 basis-full", !wide && "@lg:basis-[calc(50%-0.625rem)]")}>
      <span className="text-xs font-semibold tracking-wide text-muted-foreground/80 uppercase">{title}</span>
      {children}
    </div>
  );
}

function SchemaDetails({ schema }: { schema: unknown }) {
  return (
    <details className="group rounded-none border border-border">
      <summary className="cursor-pointer px-2 py-1 text-xs text-muted-foreground select-none group-open:border-b group-open:border-border">
        Schema
      </summary>
      <pre className="scroll-discreet overflow-x-auto p-2 font-mono text-xs leading-relaxed">
        {JSON.stringify(schema, null, 2)}
      </pre>
    </details>
  );
}

export function EndpointDetailPanel({ endpoint, selected, alreadyInCollection, onToggleSelected }: EndpointDetailPanelProps) {
  if (!endpoint) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 rounded-none border border-border bg-card p-4 text-center text-xs text-muted-foreground">
        <span>Select an endpoint to see its details</span>
      </div>
    );
  }

  const method = endpoint.method.toUpperCase();

  return (
    <div className="@container scroll-discreet flex h-full flex-col gap-3 overflow-y-auto rounded-none border border-border bg-card p-3">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-mono text-xs font-semibold", methodTextStyle(method))}>
            {method}
          </span>
          <span className="font-mono text-xs break-all" title={endpoint.path}>
            {endpoint.path}
          </span>
        </div>
        {onToggleSelected && (
          <Button
            variant="outline"
            size="xs"
            disabled={alreadyInCollection}
            onClick={() => onToggleSelected(endpoint.id)}
          >
            {selected || alreadyInCollection ? <CheckSquareIcon size={12} /> : <SquareIcon size={12} />}
            {alreadyInCollection ? "In collection" : selected ? "Selected" : "Select"}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-4">
      {/* overview */}
      {(endpoint.operationId || alreadyInCollection || (endpoint.tags && endpoint.tags.length > 0)) && (
        <Section title="Overview">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1">
              {endpoint.operationId && <span className="text-xs text-muted-foreground">ID: {endpoint.operationId}</span>}
              {alreadyInCollection && (
                <span className="rounded-none border border-emerald-600/40 px-1.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                  Already in collection
                </span>
              )}
            </div>
            {endpoint.tags && endpoint.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {endpoint.tags.map((tag) => (
                  <span key={tag} className="rounded-none border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* summary / description */}
      {(endpoint.summary || endpoint.description) && (
        <Section title="Description">
          {endpoint.summary && <p className="text-xs"><LinkedText text={endpoint.summary} /></p>}
          {endpoint.description && endpoint.description !== endpoint.summary && (
            <p className="text-xs text-muted-foreground"><LinkedText text={endpoint.description} /></p>
          )}
        </Section>
      )}

      {/* produces */}
      {endpoint.produces && endpoint.produces.length > 0 && (
        <Section title="Produces">
          <div className="flex flex-wrap gap-1">
            {endpoint.produces.map((type) => (
              <span key={type} className="rounded-none border border-border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {type}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* parameters */}
      {endpoint.parameters && endpoint.parameters.length > 0 && (
        <Section title={`Parameters (${endpoint.parameters.length})`} wide>
          <div className="flex flex-col">
            {endpoint.parameters.map((param, i) => (
              <div
                key={`${param.in}-${param.name}`}
                className={cn(
                  "flex flex-col gap-1 py-1.5",
                  i > 0 && "border-t border-border/50"
                )}
              >
                <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5 text-xs">
                  <span className={cn("shrink-0", param.required ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                    {param.required ? "●" : "○"}
                  </span>
                  <span className="font-mono">{param.name}</span>
                  <span className="text-muted-foreground">({param.in}{param.type ? `: ${param.type}` : ""})</span>
                  {param.description && <LinkedText text={param.description} className="text-muted-foreground" />}
                </div>
                {(param.enum || param.example !== undefined) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pl-4 text-xs text-muted-foreground">
                    {param.enum && (
                      <span>
                        enum: <span className="font-mono">{param.enum.join(" | ")}</span>
                      </span>
                    )}
                    {param.example !== undefined && (
                      <span>
                        example: <span className="font-mono">{JSON.stringify(param.example)}</span>
                      </span>
                    )}
                  </div>
                )}
                {param.schema !== undefined && (
                  <div className="pl-4">
                    <SchemaDetails schema={param.schema} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* responses */}
      {endpoint.responses && endpoint.responses.length > 0 && (
        <Section title="Responses" wide>
          <div className="flex flex-col">
            {endpoint.responses.map((resp, i) => (
              <div
                key={resp.status}
                className={cn(
                  "flex flex-col gap-1 py-1.5",
                  i > 0 && "border-t border-border/50"
                )}
              >
                <div className="flex flex-wrap items-start gap-x-2 gap-y-0.5 text-xs">
                  <span className="font-mono font-semibold">{resp.status}</span>
                  {resp.description && <LinkedText text={resp.description} className="text-muted-foreground" />}
                </div>
                {resp.schema !== undefined && (
                  <div className="pl-4">
                    <SchemaDetails schema={resp.schema} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}
      </div>
    </div>
  );
}
