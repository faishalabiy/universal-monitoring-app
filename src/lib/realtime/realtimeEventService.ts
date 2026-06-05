import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createRealtimeEvent(params: {
  type: string;
  payload: Prisma.InputJsonValue;
}) {
  return prisma.realtimeEvent.create({
    data: {
      type: params.type,
      payload: params.payload,
    },
  });
}