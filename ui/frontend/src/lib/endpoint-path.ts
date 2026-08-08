/** Path templates address a resource via one or more `{Key}`/`'{Key}'` segments. */
const KEY_SEGMENT_PATTERN = /\{[^}]+\}/g;

/** Composite keys beyond this count are collapsed instead of shown inline. */
export const KEY_COLLAPSE_THRESHOLD = 3;

export function countPathKeys(path: string): number {
  return path.match(KEY_SEGMENT_PATTERN)?.length ?? 0;
}

export function shouldCollapsePathKeys(path: string): boolean {
  return countPathKeys(path) > KEY_COLLAPSE_THRESHOLD;
}

/** Strips every `(...)` key segment, leaving just the resource path skeleton, e.g. `/GetAmounts`. */
export function basePathSegment(path: string): string {
  return path.replace(/\([^)]*\)/g, '');
}
