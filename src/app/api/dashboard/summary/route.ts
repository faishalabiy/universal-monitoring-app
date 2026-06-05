import { NextResponse } from "next/server";
import { IncidentStatus, WebsiteStatus } from "@prisma/client";
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

    const [
      totalWebsites,
      upWebsites,
      downWebsites,
      degradedWebsites,
      pausedWebsites,
      unknownWebsites,
      activeIncidents,
      recentWebsites,
      activeIncidentList,
    ] = await Promise.all([
      prisma.website.count(),
      prisma.website.count({
        where: { currentStatus: WebsiteStatus.UP },
      }),
      prisma.website.count({
        where: { currentStatus: WebsiteStatus.DOWN },
      }),
      prisma.website.count({
        where: { currentStatus: WebsiteStatus.DEGRADED },
      }),
      prisma.website.count({
        where: { currentStatus: WebsiteStatus.PAUSED },
      }),
      prisma.website.count({
        where: { currentStatus: WebsiteStatus.UNKNOWN },
      }),
      prisma.incident.count({
        where: { status: IncidentStatus.ACTIVE },
      }),
      prisma.website.findMany({
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.incident.findMany({
        where: { status: IncidentStatus.ACTIVE },
        orderBy: { startedAt: "desc" },
        take: 8,
        include: {
          website: true,
        },
      }),
    ]);

    return NextResponse.json({
      data: {
        totalWebsites,
        upWebsites,
        downWebsites,
        degradedWebsites,
        pausedWebsites,
        unknownWebsites,
        activeIncidents,
        recentWebsites,
        activeIncidentList,
      },
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}
