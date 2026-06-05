import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { checkWebsite } from "../src/lib/monitor/checkWebsite";
import { handleWebsiteIncident } from "../src/lib/incidents/incidentService";
import { createRealtimeEvent } from "../src/lib/realtime/realtimeEventService";
import {
  notifyIncidentCreated,
  notifyIncidentResolved,
} from "../src/lib/notifications/notificationService";

const WORKER_TICK_INTERVAL_MS = 10_000;

let isRunning = false;

function shouldCheckWebsite(website: {
  lastCheckedAt: Date | null;
  checkIntervalSeconds: number;
}) {
  if (!website.lastCheckedAt) {
    return true;
  }

  const nextCheckAt =
    website.lastCheckedAt.getTime() + website.checkIntervalSeconds * 1000;

  return Date.now() >= nextCheckAt;
}

async function processWebsite(websiteId: string) {
  const website = await prisma.website.findUnique({
    where: {
      id: websiteId,
    },
  });

  if (!website) {
    return;
  }

  if (!website.isActive) {
    return;
  }

  console.log(`[CHECK] ${website.name} - ${website.url}`);

  const previousStatus = website.currentStatus;
  const result = await checkWebsite(website);
  const changed = previousStatus !== result.status;

  const check = await prisma.check.create({
    data: {
      websiteId: website.id,
      status: result.status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      errorMessage: result.errorMessage,
    },
  });

  await prisma.website.update({
    where: {
      id: website.id,
    },
    data: {
      currentStatus: result.status,
      lastCheckedAt: new Date(),
    },
  });

  await createRealtimeEvent({
    type: "check.completed",
    payload: {
      websiteId: website.id,
      websiteName: website.name,
      previousStatus,
      currentStatus: result.status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      errorMessage: result.errorMessage,
      checkId: check.id,
      checkedAt: check.checkedAt.toISOString(),
    },
  });

  if (changed) {
    await createRealtimeEvent({
      type: "website.status_changed",
      payload: {
        websiteId: website.id,
        websiteName: website.name,
        previousStatus,
        currentStatus: result.status,
        reason: result.errorMessage,
        checkedAt: check.checkedAt.toISOString(),
      },
    });
  }

  const incidentResult = await handleWebsiteIncident({
    website,
    previousStatus,
    currentStatus: result.status,
    checkResult: result,
  });

    if (incidentResult.action === "created" && incidentResult.incident) {
        await createRealtimeEvent({
            type: "incident.created",
            payload: {
            incidentId: incidentResult.incident.id,
            websiteId: website.id,
            websiteName: website.name,
            status: result.status,
            reason: incidentResult.incident.reason,
            startedAt: incidentResult.incident.startedAt.toISOString(),
            },
        });

        await notifyIncidentCreated({
            website,
            incident: incidentResult.incident,
            status: result.status,
        });
    }

    if (incidentResult.action === "resolved" && incidentResult.incident) {
        await createRealtimeEvent({
            type: "incident.resolved",
            payload: {
            incidentId: incidentResult.incident.id,
            websiteId: website.id,
            websiteName: website.name,
            durationSeconds: incidentResult.incident.durationSeconds,
            resolvedAt: incidentResult.incident.resolvedAt
                ? incidentResult.incident.resolvedAt.toISOString()
                : null,
            },
        });

        await notifyIncidentResolved({
            website,
            incident: incidentResult.incident,
        });
    }

  const logParts = [
    `[RESULT] ${website.name}`,
    `status=${result.status}`,
    `code=${result.statusCode ?? "-"}`,
    `time=${result.responseTimeMs ?? "-"}ms`,
  ];

  if (result.errorMessage) {
    logParts.push(`error="${result.errorMessage}"`);
  }

  if (changed) {
    logParts.push(`changed=${previousStatus}->${result.status}`);
  }

  console.log(logParts.join(" | "));
}

async function tick() {
  if (isRunning) {
    console.log("[WORKER] Previous tick still running, skip this tick.");
    return;
  }

  isRunning = true;

  try {
    const websites = await prisma.website.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dueWebsites = websites.filter(shouldCheckWebsite);

    if (dueWebsites.length === 0) {
      console.log("[WORKER] No websites due for check.");
      return;
    }

    console.log(`[WORKER] Checking ${dueWebsites.length} website(s).`);

    for (const website of dueWebsites) {
      try {
        await processWebsite(website.id);
      } catch (error) {
        console.error(`[ERROR] Failed to process website ${website.id}`, error);
      }
    }
  } catch (error) {
    console.error("[ERROR] Worker tick failed", error);
  } finally {
    isRunning = false;
  }
}

async function main() {
  console.log("[WORKER] Monitoring worker started.");
  console.log(`[WORKER] Tick interval: ${WORKER_TICK_INTERVAL_MS}ms`);

  await tick();

  setInterval(() => {
    tick();
  }, WORKER_TICK_INTERVAL_MS);
}

process.on("SIGINT", async () => {
  console.log("\n[WORKER] Stopping worker...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n[WORKER] Stopping worker...");
  await prisma.$disconnect();
  process.exit(0);
});

main().catch(async (error) => {
  console.error("[ERROR] Worker crashed", error);
  await prisma.$disconnect();
  process.exit(1);
});