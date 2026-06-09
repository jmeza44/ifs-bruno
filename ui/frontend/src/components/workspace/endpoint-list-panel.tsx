import { useMemo, useState } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { METHOD_STYLES, methodTextStyle } from "@/lib/http-method-styles";
import { cn } from "@/lib/utils";

export type EndpointListEntry = {
  id: string;
  path: string;
  method: string;
  summary?: string;
  operationId?: string;
};

export type EndpointListPanelProps = {
  entries: EndpointListEntry[];
  selected: Set<string>;
  alreadyInCollection?: Set<string>;
  activeId?: string;
  onToggleSelected: (id: string) => void;
  onViewDetail: (entry: EndpointListEntry) => void;
  onChangeProjection?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
};

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

function MethodLabel({ method }: { method: string }) {
  const upper = method.toUpperCase();
  return (
    <span className={cn("w-12 shrink-0 font-mono text-[11px] font-semibold", methodTextStyle(upper))}>
      {upper}
    </span>
  );
}

export function EndpointListPanel({
  entries,
  selected,
  alreadyInCollection,
  activeId,
  onToggleSelected,
  onViewDetail,
  onChangeProjection,
  onSave,
  isSaving,
}: EndpointListPanelProps) {
  const [search, setSearch] = useState("");
  const [activeMethods, setActiveMethods] = useState<Set<HttpMethod>>(new Set(HTTP_METHODS));

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!activeMethods.has(entry.method.toUpperCase() as HttpMethod)) return false;
      if (!term) return true;
      return (
        entry.path.toLowerCase().includes(term) ||
        (entry.summary ?? "").toLowerCase().includes(term) ||
        (entry.operationId ?? "").toLowerCase().includes(term)
      );
    });
  }, [entries, search, activeMethods]);

  return (
    <div className="flex h-full flex-col gap-1 overflow-hidden rounded-none border border-border bg-card">
      {/* header: filters */}
      <div className="flex shrink-0 flex-col gap-1.5 border-b border-border p-1.5">
        <div className="flex items-center gap-1.5">
          {onChangeProjection && (
            <Button variant="outline" size="icon" onClick={onChangeProjection} title="Change projection">
              <ArrowLeftIcon size={12} />
            </Button>
          )}
          <div className="relative flex-1">
            <MagnifyingGlassIcon size={12} className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by path, summary or operation id..."
              className="pl-7"
            />
          </div>
        </div>
        <ToggleGroup
          type="multiple"
          spacing={1}
          value={Array.from(activeMethods)}
          onValueChange={(value) => setActiveMethods(new Set(value as HttpMethod[]))}
          className="flex-wrap"
        >
          {HTTP_METHODS.map((method) => {
            const active = activeMethods.has(method);
            return (
              <ToggleGroupItem
                key={method}
                value={method}
                size="sm"
                className={cn(
                  "h-auto rounded-none border px-1.5 py-0.5 font-mono text-[11px] font-semibold transition-colors",
                  active
                    ? cn("border-border bg-muted", METHOD_STYLES[method])
                    : "border-transparent text-muted-foreground/50 hover:bg-transparent hover:text-muted-foreground"
                )}
              >
                {method}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {/* middle: scrollable list */}
      <div className="scroll-discreet flex-1 space-y-0.5 overflow-y-auto p-1.5 pt-1">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No endpoints match.</div>
        ) : (
          filtered.map((entry) => {
            const isSelected = selected.has(entry.id);
            const isLocked = alreadyInCollection?.has(entry.id) ?? false;
            const isActive = entry.id === activeId;
            return (
              <div
                key={entry.id}
                role="button"
                tabIndex={0}
                onClick={() => onViewDetail(entry)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onViewDetail(entry);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-none px-1.5 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <Checkbox
                  checked={isSelected || isLocked}
                  disabled={isLocked}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={() => onToggleSelected(entry.id)}
                  className="shrink-0"
                  title={isLocked ? "Already in collection" : isSelected ? "Deselect" : "Select"}
                />
                <MethodLabel method={entry.method} />
                <span className="truncate" title={entry.path}>
                  {entry.path}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* footer: counters + save action */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-1.5 py-1 text-xs text-muted-foreground">
        <span>
          {filtered.length}/{entries.length} shown
        </span>
        {onSave && (
          <Button size="xs" disabled={selected.size === 0 || isSaving} onClick={onSave}>
            {isSaving ? "Saving..." : `Save ${selected.size > 0 ? `(${selected.size})` : ""}`.trim()}
          </Button>
        )}
        <span>{selected.size} selected</span>
      </div>
    </div>
  );
}
