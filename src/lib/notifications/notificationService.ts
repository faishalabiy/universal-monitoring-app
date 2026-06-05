import { Incident, Website, WebsiteStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/notifications/telegram";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatDuration(seconds: number | null) {
  if (!seconds) {
    return "-";
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

export async function notifyIncidentCreated(params: {
  website: Website;
  incident: Incident;
  status: WebsiteStatus;
}) {
  const { website, incident, status } = params;

  const title = status === WebsiteStatus.DEGRADED
    ? "⚠️ Website DEGRADED"
    : "🚨 Website DOWN";

  const message = [
    `<b>${title}</b>`,
    "",
    `<b>Name:</b> ${escapeHtml(website.name)}`,
    `<b>URL:</b> ${escapeHtml(website.url)}`,
    `<b>Status:</b> ${status}`,
    `<b>Reason:</b> ${escapeHtml(incident.reason || "-")}`,
    `<b>Started At:</b> ${incident.startedAt.toLocaleString("id-ID")}`,
  ].join("\n");

  try {
    await sendTelegramMessage({
      text: message,
    });

  const notificationLog = await prisma.notificationLog.create({
    data: {
      incidentId: incident.id,
      channelId: null,
      status: "SENT",
      errorMessage: null,
    },
  });

  console.log(
    `[NOTIFICATION_LOG] Created SENT log ${notificationLog.id} for incident ${incident.id}`
  );

console.log(`[NOTIFICATION] Telegram sent for incident ${incident.id}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.notificationLog.create({
      data: {
        incidentId: incident.id,
        channelId: null,
        status: "FAILED",
        errorMessage,
      },
    });

    console.error(
      `[NOTIFICATION] Telegram failed for incident ${incident.id}:`,
      errorMessage
    );
  }
}

export async function notifyIncidentResolved(params: {
  website: Website;
  incident: Incident;
}) {
  const { website, incident } = params;

  const message = [
    `<b>✅ Website RECOVERED</b>`,
    "",
    `<b>Name:</b> ${escapeHtml(website.name)}`,
    `<b>URL:</b> ${escapeHtml(website.url)}`,
    `<b>Downtime:</b> ${formatDuration(incident.durationSeconds)}`,
    `<b>Recovered At:</b> ${
      incident.resolvedAt
        ? incident.resolvedAt.toLocaleString("id-ID")
        : "-"
    }`,
  ].join("\n");

  try {
    await sendTelegramMessage({
      text: message,
    });

  const notificationLog = await prisma.notificationLog.create({
    data: {
      incidentId: incident.id,
      channelId: null,
      status: "SENT",
      errorMessage: null,
    },
  });

  console.log(
    `[NOTIFICATION_LOG] Created SENT log ${notificationLog.id} for recovered incident ${incident.id}`
  );

  console.log(`[NOTIFICATION] Telegram recovered sent for incident ${incident.id}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await prisma.notificationLog.create({
      data: {
        incidentId: incident.id,
        channelId: null,
        status: "FAILED",
        errorMessage,
      },
    });

    console.error(
      `[NOTIFICATION] Telegram recovered failed for incident ${incident.id}:`,
      errorMessage
    );
  }
}
