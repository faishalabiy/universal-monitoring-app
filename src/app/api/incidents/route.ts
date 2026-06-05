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

    const incidents = await prisma.incident.findMany({
      orderBy: {
        startedAt: "desc",
      },
      include: {
        website: true,
      },
    });

    return NextResponse.json({
      data: incidents,
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}
