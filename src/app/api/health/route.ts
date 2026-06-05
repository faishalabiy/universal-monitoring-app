import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = await prisma.$queryRaw`SELECT NOW()`;

    return NextResponse.json({
      status: "ok",
      database: "connected",
      now,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
      },
      { status: 500 }
    );
  }
}