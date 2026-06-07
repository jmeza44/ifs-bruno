import { useRef } from "react";
import { FileCodeIcon, UploadSimpleIcon, XIcon } from "@phosphor-icons/react";

export type LoadedSpec = {
  fileName: string;
  projectionName: string;
};

export type SpecLoaderProps = {
  loaded: LoadedSpec | null;
  onLoad: (file: File) => void;
  onClear: () => void;
};

export function SpecLoader({ loaded, onLoad, onClear }: SpecLoaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onLoad(file);
    event.target.value = "";
  }

  return (
    <div className="flex h-8 w-56 items-center gap-2 rounded-none border border-border bg-background px-2.5 dark:border-input dark:bg-input/30">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      {loaded ? (
        <>
          <FileCodeIcon size={16} className="shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-xs">
            {loaded.fileName}
            <span className="text-muted-foreground"> · {loaded.projectionName}</span>
          </span>
          <button
            type="button"
            className="shrink-0 rounded-none p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Remove spec"
            onClick={onClear}
          >
            <XIcon size={14} />
          </button>
        </>
      ) : (
        <button
          type="button"
          className="flex w-full items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => inputRef.current?.click()}
        >
          <UploadSimpleIcon size={16} className="shrink-0" />
          Load spec JSON…
        </button>
      )}
    </div>
  );
}
