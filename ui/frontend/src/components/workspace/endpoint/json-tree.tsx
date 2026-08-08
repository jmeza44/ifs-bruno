import { useState } from 'react';
import { cn } from '@/lib/utils';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const INDENT_PX = 14;

function isRef(value: JsonValue): value is { $ref: string } {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && '$ref' in value;
}

function Punctuation({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>;
}

function JsonKey({ name }: { name: string }) {
  return (
    <>
      <span className="json-key font-semibold">"{name}"</span>
      <Punctuation>: </Punctuation>
    </>
  );
}

function JsonScalar({ value }: { value: string | number | boolean | null }) {
  if (value === null) return <span className="json-literal">null</span>;
  if (typeof value === 'boolean') return <span className="json-literal">{String(value)}</span>;
  if (typeof value === 'number') return <span className="json-number">{value}</span>;
  return <span className="json-string">"{value}"</span>;
}

/** Unresolved $ref left over from a circular chain — flagged distinctly, it's not normal data. */
function UnresolvedRef({ refPath }: { refPath: string }) {
  return (
    <span className="json-ref-error italic" title="This reference could not be expanded">
      "{refPath}"
    </span>
  );
}

type JsonNodeProps = {
  value: JsonValue;
  name?: string;
  depth: number;
  isLast: boolean;
};

function JsonNode({ value, name, depth, isLast }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const trailingComma = !isLast && <Punctuation>,</Punctuation>;
  const indent = { paddingLeft: depth * INDENT_PX };

  if (isRef(value)) {
    return (
      <div style={indent}>
        {name !== undefined && <JsonKey name={name} />}
        <Punctuation>{'{ '}</Punctuation>
        <span className="json-key font-semibold">"$ref"</span>
        <Punctuation>: </Punctuation>
        <UnresolvedRef refPath={value.$ref} />
        <Punctuation>{' }'}</Punctuation>
        {trailingComma}
      </div>
    );
  }

  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    const isArray = Array.isArray(value);
    const entries = isArray
      ? value.map((v, i): [string, JsonValue] => [String(i), v])
      : Object.entries(value);
    const openBracket = isArray ? '[' : '{';
    const closeBracket = isArray ? ']' : '}';

    if (entries.length === 0) {
      return (
        <div style={indent}>
          {name !== undefined && <JsonKey name={name} />}
          <Punctuation>
            {openBracket}
            {closeBracket}
          </Punctuation>
          {trailingComma}
        </div>
      );
    }

    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          style={indent}
          className="flex w-full cursor-pointer items-baseline gap-1 text-left hover:bg-accent/50"
        >
          <span
            className={cn(
              'inline-block w-3 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-90',
            )}
          >
            ›
          </span>
          {name !== undefined && <JsonKey name={name} />}
          <Punctuation>{openBracket}</Punctuation>
          {!expanded && (
            <>
              <span className="text-muted-foreground italic">
                {entries.length} {isArray ? 'items' : 'keys'}
              </span>
              <Punctuation>{closeBracket}</Punctuation>
              {trailingComma}
            </>
          )}
        </button>
        {expanded && (
          <>
            {entries.map(([key, v], i) => (
              <JsonNode
                key={key}
                name={isArray ? undefined : key}
                value={v}
                depth={depth + 1}
                isLast={i === entries.length - 1}
              />
            ))}
            <div style={indent}>
              <Punctuation>{closeBracket}</Punctuation>
              {trailingComma}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={indent}>
      {name !== undefined && <JsonKey name={name} />}
      <JsonScalar value={value} />
      {trailingComma}
    </div>
  );
}

export function JsonTree({ data }: { data: unknown }) {
  return (
    <div className="json-tree scroll-discreet overflow-x-auto p-2 font-mono text-xs leading-relaxed">
      <JsonNode value={data as JsonValue} depth={0} isLast />
    </div>
  );
}
