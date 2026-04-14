import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { serverEnv } from './env';

export interface UploadToS3Input {
  key: string;
  body: PutObjectCommandInput['Body'];
  contentType?: string;
  cacheControl?: string;
  contentLength?: number;
}

export const s3Client = new S3Client({
  endpoint: serverEnv.s3Endpoint,
  region: serverEnv.s3Region,
  forcePathStyle: serverEnv.s3ForcePathStyle,
  credentials: {
    accessKeyId: serverEnv.s3AccessKey,
    secretAccessKey: serverEnv.s3SecretKey,
  },
});

export function buildS3PublicUrl(key: string): string {
  return `${serverEnv.s3PublicUrl}/${key}`;
}

export async function uploadToS3(input: UploadToS3Input): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: serverEnv.s3Bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
      ContentLength: input.contentLength,
    })
  );

  return buildS3PublicUrl(input.key);
}

export async function clearS3Bucket(): Promise<number> {
  let deletedObjects = 0;
  let continuationToken: string | undefined;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: serverEnv.s3Bucket,
        ContinuationToken: continuationToken,
      })
    );

    const objects = response.Contents ?? [];
    if (objects.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: serverEnv.s3Bucket,
          Delete: {
            Objects: objects
              .map((object) => object.Key)
              .filter((key): key is string => Boolean(key))
              .map((key) => ({ Key: key })),
            Quiet: true,
          },
        })
      );
    }

    deletedObjects += objects.length;
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return deletedObjects;
}

export async function deleteS3Objects(keys: string[]): Promise<number> {
  const uniqueKeys = [...new Set(keys.filter(Boolean))];
  if (uniqueKeys.length === 0) {
    return 0;
  }

  const batchSize = 1000;
  let deletedObjects = 0;

  for (let index = 0; index < uniqueKeys.length; index += batchSize) {
    const batch = uniqueKeys.slice(index, index + batchSize);
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: serverEnv.s3Bucket,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
          Quiet: true,
        },
      })
    );

    deletedObjects += batch.length;
  }

  return deletedObjects;
}
