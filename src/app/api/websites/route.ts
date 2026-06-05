import { NextResponse } from "next/server";
import { WebsiteType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/requireAuth";
import {
  badRequestResponse,
  forbiddenResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { validateWebsiteInput } from "@/lib/websites/validateWebsite";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return unauthorizedResponse();
    }

    const websites = await prisma.website.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            checks: true,
            incidents: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: websites,
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    try {
      await requireAdmin();
    } catch (error) {
      if ((error as Error).message === "UNAUTHORIZED") {
        return unauthorizedResponse();
      }

      if ((error as Error).message === "FORBIDDEN") {
        return forbiddenResponse();
      }

      throw error;
    }

    const body = await request.json();
    const validation = validateWebsiteInput(body);

    if (validation.error || !validation.data) {
      return badRequestResponse(validation.error || "Input tidak valid.");
    }

    const url = new URL(validation.data.url);

    const website = await prisma.website.create({
      data: {
        name: validation.data.name,
        url: validation.data.url,
        type: url.protocol === "https:" ? WebsiteType.HTTPS : WebsiteType.HTTP,
        checkIntervalSeconds: validation.data.checkIntervalSeconds,
        timeoutSeconds: validation.data.timeoutSeconds,
        expectedStatusCode: validation.data.expectedStatusCode,
        expectedKeyword: validation.data.expectedKeyword,
        degradedThresholdMs: validation.data.degradedThresholdMs,
      },
    });

    return NextResponse.json(
      {
        message: "Website berhasil ditambahkan.",
        data: website,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}