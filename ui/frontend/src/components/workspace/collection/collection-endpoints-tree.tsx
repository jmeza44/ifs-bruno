import { useMemo, useState } from 'react';
import { CaretRightIcon, FolderIcon, RowsIcon, StackIcon } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { MethodLabel } from '@/components/workspace/shared/method-label';
import { cn } from '@/lib/utils';

export type StoredEndpoint = {
  name: string;
  method: string;
  operationId?: string;
};

export type CollectionFolder = {
  name: string;
  endpoints: StoredEndpoint[];
};

export type CollectionEndpointsTreeProps = {
  folders: CollectionFolder[];
  hasActiveCollection?: boolean;
};

/** Shared across the scroll container, each folder's <ul>, and each <li> row via subgrid,
 *  so the method column lines up at the same width across every folder in the tree. */
const ENDPOINT_TREE_GRID_COLUMNS = 'grid-cols-[auto_1fr]';

function FolderRow({
  folder,
  open,
  onToggle,
}: {
  folder: CollectionFolder;
  open: boolean;
  onToggle: (name: string) => void;
}) {
  return (
    <div className="col-span-full grid grid-cols-subgrid">
      <button
        type="button"
        onClick={() => onToggle(folder.name)}
        className="col-span-full flex w-full items-center gap-1.5 rounded-none px-1.5 py-1 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <CaretRightIcon
          size={12}
          className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
        />
        <FolderIcon size={14} className="shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{folder.name}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {folder.endpoints.length}
        </span>
      </button>

      {open && (
        <ul className="col-span-full ml-5 grid grid-cols-subgrid space-y-0.5 border-l border-border pl-2">
          {folder.endpoints.map((endpoint) => (
            <li
              key={endpoint.operationId ?? endpoint.name}
              className="col-span-full grid grid-cols-subgrid items-center gap-2 rounded-none px-1.5 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <MethodLabel method={endpoint.method} />
              <span className="truncate" title={endpoint.name}>
                {endpoint.name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CollectionEndpointsTree({
  folders,
  hasActiveCollection = false,
}: CollectionEndpointsTreeProps) {
  const allFolderNames = useMemo(() => folders.map((folder) => folder.name), [folders]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => new Set(allFolderNames));

  function toggleFolder(name: string) {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (folders.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 rounded-none border border-border bg-card p-4 text-center text-xs text-muted-foreground">
        <FolderIcon size={20} />
        <span>
          {hasActiveCollection ? 'No endpoints in this collection yet' : 'No collection selected'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-1 overflow-hidden rounded-none border border-border bg-card">
      <div className="flex shrink-0 items-center justify-end gap-1 border-b border-border px-1.5 py-1">
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          onClick={() => setOpenFolders(new Set(allFolderNames))}
        >
          <RowsIcon size={12} />
          Expand all
        </Button>
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          onClick={() => setOpenFolders(new Set())}
        >
          <StackIcon size={12} />
          Collapse all
        </Button>
      </div>

      <div
        className={cn(
          'scroll-discreet grid flex-1 gap-y-0.5 overflow-y-auto p-2 pt-0',
          ENDPOINT_TREE_GRID_COLUMNS,
        )}
      >
        {folders.map((folder) => (
          <FolderRow
            key={folder.name}
            folder={folder}
            open={openFolders.has(folder.name)}
            onToggle={toggleFolder}
          />
        ))}
      </div>
    </div>
  );
}
