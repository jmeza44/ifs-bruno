import { brunoAdapter } from './bruno-adapter';
import { postmanAdapter } from './postman-adapter';
import type { CollectionAdapter } from './types';

export type { CollectionAdapter };
export { brunoAdapter, postmanAdapter };

const adapters: CollectionAdapter[] = [brunoAdapter, postmanAdapter];

export function resolveAdapter(collectionPath: string): CollectionAdapter | null {
  return adapters.find((a) => a.detect(collectionPath)) ?? null;
}
