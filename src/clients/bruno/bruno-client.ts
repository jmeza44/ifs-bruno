import { CollectionClient } from '@core/collection/collection-client';
import { BrunoInitOptions, brunoInit } from './bruno-init';
import {
  brunoDetect,
  brunoReadFolders,
  brunoReadDetails,
  brunoReadName,
  brunoReadBaseHost,
  brunoCountEndpoints,
} from './bruno-reader';
import { brunoWrite } from './bruno-writer';

export class BrunoClient implements CollectionClient<BrunoInitOptions> {
  readonly format = 'bruno' as const;

  detect(collectionPath: string): boolean {
    return brunoDetect(collectionPath);
  }

  init(collectionPath: string, options: BrunoInitOptions): void {
    return brunoInit(collectionPath, options);
  }

  readFolders(collectionPath: string) {
    return brunoReadFolders(collectionPath);
  }

  readDetails(collectionPath: string) {
    return brunoReadDetails(collectionPath);
  }

  readName(collectionPath: string): string | null {
    return brunoReadName(collectionPath);
  }

  readBaseHost(collectionPath: string): string | null {
    return brunoReadBaseHost(collectionPath);
  }

  countEndpoints(collectionPath: string): number {
    return brunoCountEndpoints(collectionPath);
  }

  write(
    collectionPath: string,
    folderName: string,
    requests: import('../../core/request/canonical-request').CanonicalRequest[],
  ) {
    return brunoWrite(collectionPath, folderName, requests);
  }
}

export const brunoClient = new BrunoClient();
