import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sendEvent(controller: ReadableStreamDefaultController, data: unknown) {
  const encoder = new TextEncoder();

  controller.enqueue(
    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
  );
}

export async function GET() {
  const session = await getSession();

  if (!session) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  let lastEventDate = new Date();

  const stream = new ReadableStream({
    async start(controller) {
      sendEvent(controller, {
        type: "connected",
        payload: {
          message: "SSE connected",
          connectedAt: new Date().toISOString(),
        },
      });

      const interval = setInterval(async () => {
        try {
          const events = await prisma.realtimeEvent.findMany({
            where: {
              createdAt: {
                gt: lastEventDate,
              },
            },
            orderBy: {
              createdAt: "asc",
            },
            take: 50,
          });

          for (const event of events) {
            sendEvent(controller, {
              id: event.id,
              type: event.type,
              payload: event.payload,
              createdAt: event.createdAt.toISOString(),
            });

            lastEventDate = event.createdAt;
          }

          sendEvent(controller, {
            type: "ping",
            payload: {
              time: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error("[SSE] Error:", error);
          sendEvent(controller, {
            type: "error",
            payload: {
              message: "Failed to fetch realtime events",
            },
          });
        }
      }, 3000);

      return () => {
        clearInterval(interval);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "access-control-allow-origin": "*",
    },
  });
}