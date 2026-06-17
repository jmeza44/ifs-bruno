import { brunoClient } from '@clients/bruno/bruno-client';
import { postmanClient } from '@clients/postman/postman-client';
import type { CollectionClient } from './collection-client';

const clients: CollectionClient[] = [brunoClient, postmanClient];

export function resolveClient(path: string): CollectionClient | null {
  return clients.find((c) => c.detect(path)) ?? null;
}

// Keep resolveAdapter as alias for profile-store.ts compatibility
export { resolveClient as resolveAdapter };
