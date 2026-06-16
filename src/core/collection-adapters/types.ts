import type { CollectionDetails, CollectionFolder } from '../collection-reader';

export interface CollectionAdapter {
  readonly format: 'bruno' | 'postman';
  detect(collectionPath: string): boolean;
  readFolders(collectionPath: string): CollectionFolder[];
  readDetails(collectionPath: string): CollectionDetails | null;
  readName(collectionPath: string): string | null;
  readBaseHost(collectionPath: string): string | null;
  countEndpoints(collectionPath: string): number;
}
