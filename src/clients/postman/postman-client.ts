import { CollectionClient } from '@core/collection/collection-client';
import { PostmanInitOptions, postmanInit } from './postman-init';
import {
  postmanDetect,
  postmanReadFolders,
  postmanReadDetails,
  postmanReadName,
  postmanReadBaseHost,
  postmanCountEndpoints,
} from './postman-reader';
import { postmanWrite } from './postman-writer';

export class PostmanClient implements CollectionClient<PostmanInitOptions> {
  readonly format = 'postman' as const;

  detect(collectionPath: string): boolean {
    return postmanDetect(collectionPath);
  }

  init(collectionPath: string, options: PostmanInitOptions): void {
    return postmanInit(collectionPath, options);
  }

  readFolders(collectionPath: string) {
    return postmanReadFolders(collectionPath);
  }

  readDetails(collectionPath: string) {
    return postmanReadDetails(collectionPath);
  }

  readName(collectionPath: string): string | null {
    return postmanReadName(collectionPath);
  }

  readBaseHost(collectionPath: string): string | null {
    return postmanReadBaseHost(collectionPath);
  }

  countEndpoints(collectionPath: string): number {
    return postmanCountEndpoints(collectionPath);
  }

  write(
    collectionPath: string,
    folderName: string,
    requests: import('../../core/request/canonical-request').CanonicalRequest[],
  ) {
    return postmanWrite(collectionPath, folderName, requests);
  }
}

export const postmanClient = new PostmanClient();
