import { IncidentStatus, Website, WebsiteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { WebsiteCheckResult } from "@/lib/monitor/checkWebsite";

function isProblemStatus(status: WebsiteStatus) {
  return status === WebsiteStatus.DOWN || status === WebsiteStatus.DEGRADED;
}

export async function handleWebsiteIncident(params: {
  website: Website;
  previousStatus: WebsiteStatus;
  currentStatus: WebsiteStatus;
  checkResult: WebsiteCheckResult;
}) {
  const { website, previousStatus, currentStatus, checkResult } = params;

  const activeIncident = await prisma.incident.findFirst({
    where: {
      websiteId: website.id,
      status: IncidentStatus.ACTIVE,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  const wasProblem = isProblemStatus(previousStatus);
  const isProblem = isProblemStatus(currentStatus);

  if (!wasProblem && isProblem && !activeIncident) {
    const incident = await prisma.incident.create({
      data: {
        websiteId: website.id,
        status: IncidentStatus.ACTIVE,
        reason: checkResult.errorMessage || `Website status changed to ${currentStatus}`,
      },
    });

    console.log(
      `[INCIDENT] Created incident for ${website.name} | status=${currentStatus}`
    );

    return {
      action: "created" as const,
      incident,
    };
  }

  if (isProblem && !activeIncident) {
    const incident = await prisma.incident.create({
      data: {
        websiteId: website.id,
        status: IncidentStatus.ACTIVE,
        reason: checkResult.errorMessage || `Website status is ${currentStatus}`,
      },
    });

    console.log(
      `[INCIDENT] Created missing active incident for ${website.name} | status=${currentStatus}`
    );

    return {
      action: "created" as const,
      incident,
    };
  }

  if (wasProblem && currentStatus === WebsiteStatus.UP && activeIncident) {
    const resolvedAt = new Date();
    const durationSeconds = Math.floor(
      (resolvedAt.getTime() - activeIncident.startedAt.getTime()) / 1000
    );

    const incident = await prisma.incident.update({
      where: {
        id: activeIncident.id,
      },
      data: {
        status: IncidentStatus.RESOLVED,
        resolvedAt,
        durationSeconds,
      },
    });

    console.log(
      `[INCIDENT] Resolved incident for ${website.name} | duration=${durationSeconds}s`
    );

    return {
      action: "resolved" as const,
      incident,
    };
  }

  return {
    action: "none" as const,
    incident: null,
  };
}
