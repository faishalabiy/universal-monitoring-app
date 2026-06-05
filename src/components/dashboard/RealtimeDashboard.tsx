"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";

type Website = {
  id: string;
  name: string;
  url: string;
  currentStatus: string;
  lastCheckedAt: string | null;
};

type Incident = {
  id: string;
  reason: string | null;
  startedAt: string;
  durationSeconds: number | null;
  website: {
    id: string;
    name: string;
    url: string;
  };
};

type DashboardSummary = {
  totalWebsites: number;
  upWebsites: number;
  downWebsites: number;
  degradedWebsites: number;
  pausedWebsites: number;
  unknownWebsites: number;
  activeIncidents: number;
  recentWebsites: Website[];
  activeIncidentList: Incident[];
};

type RealtimeDashboardProps = {
  initialData: DashboardSummary;
};

function getStatusClass(status: string) {
  if (status === "UP") return "ps-status-up";
  if (status === "DOWN") return "ps-status-down";
  if (status === "DEGRADED")
    return "ps-status-degraded";
  if (status === "PAUSED") return "ps-status-paused";

  return "ps-status-unknown";
}

function formatDate(value: string | null, isMounted: boolean) {
  if (!value) return "-";
  if (!isMounted) return "-";

  return new Date(value).toLocaleString("id-ID");
}

function formatDurationFromStart(startedAt: string, nowMs: number) {
  const seconds = Math.max(
    0,
    Math.floor((nowMs - new Date(startedAt).getTime()) / 1000)
  );

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function subscribeToMountedState() {
  return () => {};
}

export default function RealtimeDashboard({
  initialData,
}: RealtimeDashboardProps) {
  const [summary, setSummary] = useState(initialData);
  const [lastEvent, setLastEvent] = useState<string>("Belum ada event");
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const isMounted = useSyncExternalStore(
    subscribeToMountedState,
    () => true,
    () => false
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  async function refreshSummary() {
    const response = await fetch("/api/dashboard/summary", {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const json = await response.json();
    setSummary(json.data);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 30_000);

    return () => {
      clearInterval(interval);
    };
  }, []);


  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onopen = () => {
      setConnectionStatus("connected");
    };

    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "ping") {
          return;
        }

        setLastEvent(`${data.type} - ${new Date().toLocaleTimeString("id-ID")}`);

        if (
          [
            "check.completed",
            "website.status_changed",
            "incident.created",
            "incident.resolved",
            "notification.sent",
          ].includes(data.type)
        ) {
          await refreshSummary();
        }
      } catch (error) {
        console.error("Failed to parse SSE event", error);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus("disconnected");
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <>
      <div className="ps-card mb-6 p-5 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Realtime status</span>
            <span
              className={`ps-badge ${
                connectionStatus === "connected"
                  ? "ps-status-up"
                  : connectionStatus === "connecting"
                  ? "ps-status-degraded"
                  : "ps-status-down"
              }`}
            >
              {connectionStatus}
            </span>
          </div>

          <div className="text-[var(--ps-body-light)]">Last event: {lastEvent}</div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Total Website</p>
          <p className="ps-heading-xl mt-2">{summary.totalWebsites}</p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">UP</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-primary)]">
            {summary.upWebsites}
          </p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">DOWN</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-warning)]">
            {summary.downWebsites}
          </p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">DEGRADED</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-commerce)]">
            {summary.degradedWebsites}
          </p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">PAUSED</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-muted-light)]">
            {summary.pausedWebsites}
          </p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Active Incident</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-warning)]">
            {summary.activeIncidents}
          </p>
        </div>
      </div>

      {summary.unknownWebsites > 0 ? (
        <div className="mb-6 rounded-[var(--ps-radius-md)] bg-[var(--ps-primary)] p-5 text-sm font-semibold text-white">
          Ada {summary.unknownWebsites} website dengan status UNKNOWN. Jalankan
          worker agar statusnya segera diperbarui.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="ps-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--ps-hairline-light)] px-5 py-4">
            <div>
              <h2 className="ps-heading-md">Website Terbaru</h2>
              <p className="ps-caption mt-1 text-[var(--ps-muted-light)]">
                Ringkasan status website yang terakhir berubah.
              </p>
            </div>

            <Link
              href="/websites"
              className="ps-link text-sm"
            >
              Lihat semua
            </Link>
          </div>

          {summary.recentWebsites.length === 0 ? (
            <div className="p-5 text-sm text-[var(--ps-body-light)]">
              Belum ada website yang dimonitor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>Website</th>
                    <th>Status</th>
                    <th>Last Checked</th>
                  </tr>
                </thead>

                <tbody>
                  {summary.recentWebsites.map((website) => (
                    <tr key={website.id}>
                      <td>
                        <div className="font-semibold">{website.name}</div>
                        <div className="text-xs text-[var(--ps-muted-light)]">
                          {website.url}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`ps-badge ${getStatusClass(
                            website.currentStatus
                          )}`}
                        >
                          {website.currentStatus}
                        </span>
                      </td>

                      <td>
                        {formatDate(website.lastCheckedAt, isMounted)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="ps-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--ps-hairline-light)] px-5 py-4">
            <div>
              <h2 className="ps-heading-md">Active Incidents</h2>
              <p className="ps-caption mt-1 text-[var(--ps-muted-light)]">
                Incident yang masih aktif dan perlu perhatian.
              </p>
            </div>

            <Link
              href="/incidents"
              className="ps-link text-sm"
            >
              Lihat semua
            </Link>
          </div>

          {summary.activeIncidentList.length === 0 ? (
            <div className="p-5 text-sm text-[var(--ps-body-light)]">
              Tidak ada active incident.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>Website</th>
                    <th>Reason</th>
                    <th>Started</th>
                    <th>Duration</th>
                  </tr>
                </thead>

                <tbody>
                  {summary.activeIncidentList.map((incident) => (
                    <tr key={incident.id}>
                      <td>
                        <div className="font-semibold">
                          {incident.website.name}
                        </div>
                        <div className="text-xs text-[var(--ps-muted-light)]">
                          {incident.website.url}
                        </div>
                      </td>

                      <td className="max-w-sm text-[var(--ps-body-light)]">
                        {incident.reason || "-"}
                      </td>

                      <td>
                        {formatDate(incident.startedAt, isMounted)}
                      </td>

                      <td>
                        {isMounted ? formatDurationFromStart(incident.startedAt, nowMs) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
