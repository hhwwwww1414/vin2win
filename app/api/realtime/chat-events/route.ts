import { type ChatRealtimeEvent } from '@/lib/chat/realtime';
import { subscribeToChatEvents } from '@/lib/server/chat-realtime';
import { getSessionUser } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function encodeSseEvent(event: ChatRealtimeEvent) {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

function encodeSseComment(comment: string) {
  return `: ${comment}\n\n`;
}

export async function GET(request: Request) {
  const currentUser = await getSessionUser();
  if (!currentUser) {
    return new Response(JSON.stringify({ error: 'Требуется авторизация.' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  const encoder = new TextEncoder();
  let cleanupStream = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (closed) {
          return;
        }

        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanupStream();
        }
      };

      send(encodeSseComment('connected'));

      const unsubscribe = subscribeToChatEvents(currentUser.id, (event) => {
        send(encodeSseEvent(event));
      });

      const keepAliveId = setInterval(() => {
        send(encodeSseComment('keepalive'));
      }, 25_000);

      const cleanup = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(keepAliveId);
        request.signal.removeEventListener('abort', cleanup);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // noop
        }
      };

      cleanupStream = cleanup;
      request.signal.addEventListener('abort', cleanup, { once: true });
    },
    cancel() {
      cleanupStream();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
