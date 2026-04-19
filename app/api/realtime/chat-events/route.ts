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

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        controller.enqueue(encoder.encode(chunk));
      };

      send(encodeSseComment('connected'));

      const unsubscribe = subscribeToChatEvents(currentUser.id, (event) => {
        send(encodeSseEvent(event));
      });

      const keepAliveId = setInterval(() => {
        send(encodeSseComment('keepalive'));
      }, 25_000);

      const cleanup = () => {
        clearInterval(keepAliveId);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // noop
        }
      };

      request.signal.addEventListener('abort', cleanup, { once: true });
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
