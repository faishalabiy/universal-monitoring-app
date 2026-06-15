import { WebsiteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type UptimeRange = "24h" | "7d" | "30d";

type ReportWindow = {
  label: UptimeRange;
  from: Date;
};

function getReportWindows(now = new Date()): ReportWindow[] {
  return [
    {
      label: "24h",
      from: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      label: "7d",
      from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      label: "30d",
      from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  ];
}

function isHealthyStatus(status: WebsiteStatus) {
  return status === WebsiteStatus.UP;
}

function isProblemStatus(status: WebsiteStatus) {
  return status === WebsiteStatus.DOWN || status === WebsiteStatus.DEGRADED;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export async function getWebsiteUptimeReport(websiteId: string) {
  const now = new Date();
  const windows = getReportWindows(now);

  const reports = await Promise.all(
    windows.map(async (window) => {
      const checks = await prisma.check.findMany({
        where: {
          websiteId,
          checkedAt: {
            gte: window.from,
            lte: now,
          },
        },
        orderBy: {
          checkedAt: "asc",
        },
        select: {
          id: true,
          status: true,
          statusCode: true,
          responseTimeMs: true,
          errorMessage: true,
          checkedAt: true,
        },
      });

      const totalChecks = checks.length;
      const upChecks = checks.filter((check) => isHealthyStatus(check.status)).length;
      const problemChecks = checks.filter((check) => isProblemStatus(check.status)).length;
      const unknownChecks = checks.filter(
        (check) => check.status === WebsiteStatus.UNKNOWN
      ).length;

      const responseTimes = checks
        .map((check) => check.responseTimeMs)
        .filter((value): value is number => typeof value === "number");

      const averageResponseTimeMs =
        responseTimes.length > 0
          ? Math.round(
              responseTimes.reduce((sum, value) => sum + value, 0) /
                responseTimes.length
            )
          : null;

      const minResponseTimeMs =
        responseTimes.length > 0 ? Math.min(...responseTimes) : null;

      const maxResponseTimeMs =
        responseTimes.length > 0 ? Math.max(...responseTimes) : null;

      const uptimePercentage =
        totalChecks > 0 ? round((upChecks / totalChecks) * 100, 2) : null;

      const problemPercentage =
        totalChecks > 0 ? round((problemChecks / totalChecks) * 100, 2) : null;

      return {
        range: window.label,
        from: window.from.toISOString(),
        to: now.toISOString(),
        totalChecks,
        upChecks,
        problemChecks,
        unknownChecks,
        uptimePercentage,
        problemPercentage,
        averageResponseTimeMs,
        minResponseTimeMs,
        maxResponseTimeMs,
      };
    })
  );

  return reports;
}

export async function getWebsiteResponseTimeSeries(
  websiteId: string,
  range: UptimeRange = "24h"
) {
  const now = new Date();

  const from =
    range === "24h"
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : range === "7d"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const checks = await prisma.check.findMany({
    where: {
      websiteId,
      checkedAt: {
        gte: from,
        lte: now,
      },
    },
    orderBy: {
      checkedAt: "asc",
    },
    select: {
      id: true,
      status: true,
      responseTimeMs: true,
      checkedAt: true,
    },
  });

  return checks.map((check) => ({
    id: check.id,
    status: check.status,
    responseTimeMs: check.responseTimeMs,
    checkedAt: check.checkedAt.toISOString(),
  }));
}