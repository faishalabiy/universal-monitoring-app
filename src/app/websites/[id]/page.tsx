import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type WebsiteDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getStatusClass(status: string) {
  if (status === "UP") return "ps-status-up";
  if (status === "DOWN") return "ps-status-down";
  if (status === "DEGRADED")
    return "ps-status-degraded";
  if (status === "PAUSED") return "ps-status-paused";

  return "ps-status-unknown";
}

function getIncidentStatusClass(status: string) {
  if (status === "ACTIVE") {
    return "ps-status-down";
  }

  return "ps-status-up";
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "-";

  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
}

function formatDate(date: Date | null) {
  if (!date) return "-";

  return date.toLocaleString("id-ID");
}

function formatResponseTime(value: number | null) {
  if (value === null || value === undefined) return "-";

  return `${value}ms`;
}

export default async function WebsiteDetailPage({
  params,
}: WebsiteDetailPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const website = await prisma.website.findUnique({
    where: {
      id,
    },
    include: {
      checks: {
        orderBy: {
          checkedAt: "desc",
        },
        take: 30,
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
    notFound();
  }

  const latestCheck = website.checks[0] ?? null;

  const totalChecks = website.checks.length;
  const upChecks = website.checks.filter((check) => check.status === "UP").length;

  const uptimePercentage =
    totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(2) : "-";

  const averageResponseTime =
    website.checks.length > 0
      ? Math.round(
          website.checks
            .filter((check) => check.responseTimeMs !== null)
            .reduce((total, check) => total + (check.responseTimeMs ?? 0), 0) /
            Math.max(
              1,
              website.checks.filter((check) => check.responseTimeMs !== null)
                .length
            )
        )
      : null;

  return (
    <main className="ps-page">
      <section className="ps-hero-dark">
        <div className="ps-container flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-3xl">
          <Link
            href="/websites"
            className="text-sm font-semibold text-[var(--ps-link-dark)]"
          >
            ← Kembali ke Websites
          </Link>

          <h1 className="ps-display-lg mt-3">{website.name}</h1>

          <a
            href={website.url}
            target="_blank"
            className="mt-3 block text-sm font-semibold text-[var(--ps-link-dark)]"
          >
            {website.url}
          </a>
        </div>

        <div className="flex items-center gap-3">
        <Link
            href={`/websites/${website.id}/edit`}
            className="ps-button-secondary ps-button-dark"
        >
            Edit
        </Link>

        <span
            className={`ps-badge ${getStatusClass(
            website.currentStatus
            )}`}
        >
            {website.currentStatus}
        </span>
        </div>
        </div>
      </section>

      <div className="ps-container ps-content-stack">
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Current Status</p>
          <p className="ps-heading-xl mt-2">{website.currentStatus}</p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Last Response</p>
          <p className="ps-heading-xl mt-2">
            {formatResponseTime(latestCheck?.responseTimeMs ?? null)}
          </p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Average Response</p>
          <p className="ps-heading-xl mt-2">
            {formatResponseTime(averageResponseTime)}
          </p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Uptime Recent Checks</p>
          <p className="ps-heading-xl mt-2">
            {uptimePercentage === "-" ? "-" : `${uptimePercentage}%`}
          </p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Last Checked</p>
          <p className="mt-2 text-sm font-semibold">
            {formatDate(website.lastCheckedAt)}
          </p>
        </div>
      </div>

      <div className="ps-card mb-6 p-5">
        <h2 className="ps-heading-md">Konfigurasi Monitoring</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="ps-caption text-[var(--ps-muted-light)]">Active</p>
            <p className="mt-1 font-medium">{website.isActive ? "Yes" : "No"}</p>
          </div>

          <div>
            <p className="ps-caption text-[var(--ps-muted-light)]">Type</p>
            <p className="mt-1 font-medium">{website.type}</p>
          </div>

          <div>
            <p className="ps-caption text-[var(--ps-muted-light)]">Check Interval</p>
            <p className="mt-1 font-medium">
              {website.checkIntervalSeconds}s
            </p>
          </div>

          <div>
            <p className="ps-caption text-[var(--ps-muted-light)]">Timeout</p>
            <p className="mt-1 font-medium">{website.timeoutSeconds}s</p>
          </div>

          <div>
            <p className="ps-caption text-[var(--ps-muted-light)]">Expected Status Code</p>
            <p className="mt-1 font-medium">{website.expectedStatusCode}</p>
          </div>

          <div>
            <p className="ps-caption text-[var(--ps-muted-light)]">Expected Keyword</p>
            <p className="mt-1 font-medium">
              {website.expectedKeyword || "-"}
            </p>
          </div>

          <div>
            <p className="ps-caption text-[var(--ps-muted-light)]">Degraded Threshold</p>
            <p className="mt-1 font-medium">
              {website.degradedThresholdMs}ms
            </p>
          </div>

          <div>
            <p className="ps-caption text-[var(--ps-muted-light)]">Created At</p>
            <p className="mt-1 font-medium">{formatDate(website.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="ps-card overflow-hidden">
          <div className="border-b border-[var(--ps-hairline-light)] px-5 py-4">
            <h2 className="ps-heading-md">Check History</h2>
            <p className="ps-caption mt-1 text-[var(--ps-muted-light)]">
              30 pengecekan terakhir untuk website ini.
            </p>
          </div>

          {website.checks.length === 0 ? (
            <div className="p-5 text-sm text-[var(--ps-body-light)]">
              Belum ada check history.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Code</th>
                    <th>Response</th>
                    <th>Checked At</th>
                    <th>Error</th>
                  </tr>
                </thead>

                <tbody>
                  {website.checks.map((check) => (
                    <tr key={check.id}>
                      <td>
                        <span
                          className={`ps-badge ${getStatusClass(
                            check.status
                          )}`}
                        >
                          {check.status}
                        </span>
                      </td>

                      <td>{check.statusCode ?? "-"}</td>

                      <td>
                        {formatResponseTime(check.responseTimeMs)}
                      </td>

                      <td>
                        {formatDate(check.checkedAt)}
                      </td>

                      <td className="max-w-sm text-[var(--ps-warning)]">
                        {check.errorMessage || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="ps-card overflow-hidden">
          <div className="border-b border-[var(--ps-hairline-light)] px-5 py-4">
            <h2 className="ps-heading-md">Incident History</h2>
            <p className="ps-caption mt-1 text-[var(--ps-muted-light)]">
              20 incident terakhir untuk website ini.
            </p>
          </div>

          {website.incidents.length === 0 ? (
            <div className="p-5 text-sm text-[var(--ps-body-light)]">
              Belum ada incident history.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Started</th>
                    <th>Resolved</th>
                    <th>Duration</th>
                  </tr>
                </thead>

                <tbody>
                  {website.incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td>
                        <span
                          className={`ps-badge ${getIncidentStatusClass(
                            incident.status
                          )}`}
                        >
                          {incident.status}
                        </span>
                      </td>

                      <td className="max-w-sm text-[var(--ps-body-light)]">
                        {incident.reason || "-"}
                      </td>

                      <td>
                        {formatDate(incident.startedAt)}
                      </td>

                      <td>
                        {formatDate(incident.resolvedAt)}
                      </td>

                      <td>
                        {formatDuration(incident.durationSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      </div>
    </main>
  );
}
