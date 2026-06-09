export const METHOD_STYLES: Record<string, string> = {
  GET: 'text-emerald-600 dark:text-emerald-400',
  POST: 'text-amber-600 dark:text-amber-400',
  PUT: 'text-sky-600 dark:text-sky-400',
  PATCH: 'text-violet-600 dark:text-violet-400',
  DELETE: 'text-rose-600 dark:text-rose-400',
};

export function methodTextStyle(method: string): string {
  return METHOD_STYLES[method.toUpperCase()] ?? 'text-muted-foreground';
}
