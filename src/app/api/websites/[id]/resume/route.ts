import { NextResponse } from "next/server";
import { WebsiteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/requireAuth";
import {
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/api/response";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

    const website = await prisma.website.update({
      where: { id },
      data: {
        isActive: true,
        currentStatus: WebsiteStatus.UNKNOWN,
      },
    });

    return NextResponse.json({
      message: "Monitoring website berhasil diaktifkan kembali.",
      data: website,
    });
  } catch (error) {
    console.error(error);
    return serverErrorResponse();
  }
}