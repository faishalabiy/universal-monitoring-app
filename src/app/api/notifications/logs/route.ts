import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return unauthorizedResponse();
    }

    const logs = await prisma.notificationLog.findMany({
      orderBy: {
        sentAt: "desc",
      },
      take: 100,
      include: {
        incident: {
          include: {
            website: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: logs,
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}
