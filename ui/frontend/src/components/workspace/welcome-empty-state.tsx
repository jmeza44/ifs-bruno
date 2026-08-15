import { useRef } from 'react';
import {
  CircleNotchIcon,
  FolderPlusIcon,
  UploadSimpleIcon,
  UserCircleIcon,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/lib/workspace-store';

export type WelcomeEmptyStateProps = {
  onAddProfile: () => void;
  onLoadSpec: (file: File) => void;
  onCreateCollection: () => void;
  /** True while the initial profiles/collections lists are still being fetched. */
  isLoading: boolean;
};

type PointerArrowProps = {
  direction: 'left' | 'right';
  label: string;
};

function PointerArrow({ direction, label }: PointerArrowProps) {
  const isLeft = direction === 'left';
  return (
    <div
      className={cn(
        'pointer-events-none absolute top-4 text-muted-foreground/70',
        isLeft ? 'left-48' : 'right-92',
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          'absolute -bottom-10 w-64 text-lg font-semibold font-heading italic',
          isLeft ? 'left-24 text-left' : 'right-24 text-right',
        )}
      >
        {label}
      </span>
      <svg
        width="90"
        height="110"
        viewBox="0 0 90 110"
        fill="none"
        className={isLeft ? 'scale-x-[-1]' : undefined}
      >
        <path
          d="M8 108 C 20 70, 45 65, 55 78 C 63 89, 50 100, 40 90 C 32 82, 42 68, 58 60 C 78 50, 82 20, 78 8"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M68 12 L79 6 L84 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function WelcomeEmptyState({
  onAddProfile,
  onLoadSpec,
  onCreateCollection,
  isLoading,
}: WelcomeEmptyStateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasProfiles = useWorkspaceStore((state) => state.profiles.available.length > 0);
  const hasCollections = useWorkspaceStore((state) => state.collection.available.length > 0);
  const showLoading = useDelayedLoading(isLoading);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onLoadSpec(file);
    event.target.value = '';
  }

  if (isLoading || showLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center rounded-none border border-border bg-card p-8">
        {showLoading && (
          <CircleNotchIcon size={20} className="animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-1 flex-col items-center justify-center gap-6 rounded-none border border-border bg-card p-8 text-center">
      {hasProfiles && <PointerArrow direction="right" label="Your existing profiles are here" />}
      <PointerArrow
        direction="left"
        label={hasCollections ? 'Pick an existing collection here' : 'Create a new collection here'}
      />
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="max-w-md space-y-2">
        <h2 className="text-xl font-semibold font-heading">Welcome to IFS Bruno</h2>
        <p className="text-sm text-muted-foreground">
          Explore and classify IFS Cloud REST API endpoints, then save the ones you need into a
          Bruno or Postman collection.
        </p>
        <p className="text-sm text-muted-foreground">
          <strong>To get started you need two things:</strong> connect to an{' '}
          <strong>IFS Cloud</strong> profile or load a spec JSON file <strong>and</strong> a
          collection to save them into
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {!hasProfiles && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              1. Endpoint source
            </span>
            <div className="flex items-center gap-2">
              <Button onClick={onAddProfile}>
                <UserCircleIcon size={16} />
                New profile
              </Button>
              <Button variant="outline" onClick={() => inputRef.current?.click()}>
                <UploadSimpleIcon size={16} />
                Load spec JSON…
              </Button>
            </div>
          </div>
        )}

        {!hasCollections && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              2. Collection
            </span>
            <Button variant="outline" onClick={onCreateCollection}>
              <FolderPlusIcon size={16} />
              New collection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
