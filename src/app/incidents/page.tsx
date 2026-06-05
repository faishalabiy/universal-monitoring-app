import { redirect } from "next/navigation";
import { IncidentStatus } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function getIncidentStatusClass(status: string) {
  if (status === "ACTIVE") {
    return "ps-status-down";
  }

  return "ps-status-up";
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

export default async function IncidentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const incidents = await prisma.incident.findMany({
    orderBy: {
      startedAt: "desc",
    },
    include: {
      website: true,
    },
  });

  const activeCount = incidents.filter(
    (incident) => incident.status === IncidentStatus.ACTIVE
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === IncidentStatus.RESOLVED
  ).length;

  return (
    <main className="ps-page">
      <section className="ps-hero-dark">
        <div className="ps-container">
          <h1 className="ps-display-lg">Incidents</h1>
          <p className="ps-body-md mt-4 max-w-2xl text-[var(--ps-body-dark)]">
            Daftar incident yang dibuat otomatis oleh monitoring worker.
          </p>
        </div>
      </section>

      <div className="ps-container ps-content-stack">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Total Incidents</p>
          <p className="ps-heading-xl mt-2">{incidents.length}</p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Active</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-warning)]">{activeCount}</p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Resolved</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-primary)]">
            {resolvedCount}
          </p>
        </div>
      </div>

      <div className="ps-card overflow-hidden">
        {incidents.length === 0 ? (
          <div className="p-6 text-sm text-[var(--ps-body-light)]">
            Belum ada incident.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Started</th>
                  <th>Resolved</th>
                  <th>Duration</th>
                </tr>
              </thead>

              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <div className="font-semibold">{incident.website.name}</div>
                      <div className="text-xs text-[var(--ps-muted-light)]">
                        {incident.website.url}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`ps-badge ${getIncidentStatusClass(
                          incident.status
                        )}`}
                      >
                        {incident.status}
                      </span>
                    </td>

                    <td className="max-w-md text-[var(--ps-body-light)]">
                      {incident.reason || "-"}
                    </td>

                    <td>
                      {incident.startedAt.toLocaleString("id-ID")}
                    </td>

                    <td>
                      {incident.resolvedAt
                        ? incident.resolvedAt.toLocaleString("id-ID")
                        : "-"}
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
      </div>
      </div>
    </main>
  );
}
