import { CaretDownIcon, PlusIcon, TrashIcon, UserCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProfileOption } from "@/lib/types";

export type { ProfileOption };

export type ProfileSelectorProps = {
  active: ProfileOption | null;
  available: ProfileOption[];
  onSelect: (profile: ProfileOption) => void;
  onDelete: (profile: ProfileOption) => void;
  onAddNew: () => void;
};

export function ProfileSelector({
  active,
  available,
  onSelect,
  onDelete,
  onAddNew,
}: ProfileSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-56 justify-between">
          <span className="flex items-center gap-2 truncate">
            <UserCircleIcon size={16} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{active ? active.name : "Select a profile…"}</span>
          </span>
          <CaretDownIcon size={14} className="shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Profiles</DropdownMenuLabel>
        {available.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No profiles yet</div>
        )}
        {available.map((profile) => (
          <DropdownMenuItem
            key={profile.id}
            className="flex items-center justify-between gap-2"
            onSelect={() => onSelect(profile)}
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm">{profile.name}</span>
              <span className="truncate text-xs text-muted-foreground">{profile.environment}</span>
            </span>
            <button
              type="button"
              className="shrink-0 rounded-none p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title={`Delete ${profile.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(profile);
              }}
            >
              <TrashIcon size={14} />
            </button>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onAddNew} className="gap-2">
          <PlusIcon size={14} />
          Add profile
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
