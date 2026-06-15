import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import {
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import {
  getWebsiteResponseTimeSeries,
  getWebsiteUptimeReport,
  UptimeRange,
} from "@/lib/reports/uptimeReport";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function parseRange(value: string | null): UptimeRange {
  if (value === "7d" || value === "30d") {
    return value;
  }

  return "24h";
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getSession();

    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const range = parseRange(searchParams.get("range"));

    const website = await prisma.website.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        url: true,
        currentStatus: true,
        lastCheckedAt: true,
      },
    });

    if (!website) {
      return NextResponse.json(
        {
          message: "Website tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    const [uptimeReport, responseTimeSeries] = await Promise.all([
      getWebsiteUptimeReport(id),
      getWebsiteResponseTimeSeries(id, range),
    ]);

    return NextResponse.json({
      data: {
        website,
        selectedRange: range,
        uptimeReport,
        responseTimeSeries,
      },
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}