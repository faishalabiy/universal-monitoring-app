import { NextResponse } from "next/server";
import { WebsiteType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/requireAuth";
import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { validateWebsiteInput } from "@/lib/websites/validateWebsite";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();

    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await context.params;

    const website = await prisma.website.findUnique({
      where: { id },
      include: {
        checks: {
          orderBy: {
            checkedAt: "desc",
          },
          take: 20,
        },
        incidents: {
          orderBy: {
            startedAt: "desc",
          },
          take: 20,
        },
      },
    });

    if (!website) {
      return notFoundResponse("Website tidak ditemukan.");
    }

    return NextResponse.json({
      data: website,
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

    const { id } = await context.params;

    const existingWebsite = await prisma.website.findUnique({
      where: { id },
    });

    if (!existingWebsite) {
      return notFoundResponse("Website tidak ditemukan.");
    }

    const body = await request.json();
    const validation = validateWebsiteInput(body);

    if (validation.error || !validation.data) {
      return badRequestResponse(validation.error || "Input tidak valid.");
    }

    const url = new URL(validation.data.url);

    const website = await prisma.website.update({
      where: { id },
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

    return NextResponse.json({
      message: "Website berhasil diperbarui.",
      data: website,
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
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

    const { id } = await context.params;

    const existingWebsite = await prisma.website.findUnique({
      where: { id },
    });

    if (!existingWebsite) {
      return notFoundResponse("Website tidak ditemukan.");
    }

    await prisma.website.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Website berhasil dihapus.",
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}