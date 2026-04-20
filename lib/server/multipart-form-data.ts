import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import busboy from 'busboy';

function isMultipartRequest(request: Request) {
  const contentType = request.headers.get('content-type');
  return typeof contentType === 'string' && contentType.toLowerCase().includes('multipart/form-data');
}

function toBuffer(chunk: string | Buffer | Uint8Array) {
  if (typeof chunk === 'string') {
    return Buffer.from(chunk);
  }

  return Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
}

export async function parseMultipartRequest(request: Request) {
  if (!isMultipartRequest(request)) {
    return request.formData();
  }

  if (!request.body) {
    return new FormData();
  }

  const contentType = request.headers.get('content-type');
  if (!contentType) {
    throw new Error('Missing multipart Content-Type header.');
  }

  const formData = new FormData();
  const parser = busboy({
    headers: { 'content-type': contentType },
    defParamCharset: 'utf8',
  });
  const fileTasks: Promise<void>[] = [];

  return await new Promise<FormData>((resolve, reject) => {
    const bodyStream = Readable.fromWeb(request.body as unknown as NodeReadableStream);

    parser.on('field', (name, value) => {
      formData.append(name, value);
    });

    parser.on('file', (name, stream, info) => {
      const task = (async () => {
        const chunks: Buffer[] = [];

        for await (const chunk of stream) {
          chunks.push(toBuffer(chunk));
        }

        if (stream.truncated) {
          throw new Error(`Uploaded file "${info.filename || 'blob'}" exceeded the parser limit.`);
        }

        formData.append(
          name,
          new File(chunks, info.filename || 'blob', {
            type: info.mimeType,
          })
        );
      })();

      fileTasks.push(task);
      void task.catch(reject);
    });

    parser.once('error', reject);
    bodyStream.once('error', reject);

    parser.once('close', () => {
      void Promise.all(fileTasks).then(() => resolve(formData), reject);
    });

    bodyStream.pipe(parser);
  });
}
