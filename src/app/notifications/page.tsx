import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

function getStatusClass(status: string) {
  if (status === "SENT") {
    return "ps-status-up";
  }

  if (status === "FAILED") {
    return "ps-status-down";
  }

  return "ps-status-paused";
}

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const logs = await prisma.notificationLog.findMany({
    orderBy: {
      sentAt: "desc",
    },
    take: 100,
  });

  const incidentIds = logs
    .map((log) => log.incidentId)
    .filter((id): id is string => Boolean(id));

  const incidents = await prisma.incident.findMany({
    where: {
      id: {
        in: incidentIds,
      },
    },
    include: {
      website: true,
    },
  });

  const incidentMap = new Map(
    incidents.map((incident) => [incident.id, incident])
  );

  const sentCount = logs.filter((log) => log.status === "SENT").length;
  const failedCount = logs.filter((log) => log.status === "FAILED").length;

  return (
    <main className="ps-page">
      <section className="ps-hero-dark">
        <div className="ps-container">
          <h1 className="ps-display-lg">Notifications</h1>
          <p className="ps-body-md mt-4 max-w-2xl text-[var(--ps-body-dark)]">
            Riwayat pengiriman notifikasi monitoring.
          </p>
        </div>
      </section>

      <div className="ps-container ps-content-stack">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Total Logs</p>
          <p className="ps-heading-xl mt-2">{logs.length}</p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Sent</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-primary)]">
            {sentCount}
          </p>
        </div>

        <div className="ps-card-soft p-5">
          <p className="ps-caption text-[var(--ps-muted-light)]">Failed</p>
          <p className="ps-heading-xl mt-2 text-[var(--ps-warning)]">
            {failedCount}
          </p>
        </div>
      </div>

      <div className="ps-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-6 text-sm text-[var(--ps-body-light)]">
            Belum ada notification log.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Website</th>
                  <th>Incident</th>
                  <th>Channel</th>
                  <th>Sent At</th>
                  <th>Error</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => {
                  const incident = log.incidentId
                    ? incidentMap.get(log.incidentId)
                    : null;

                  return (
                    <tr key={log.id}>
                      <td>
                        <span
                          className={`ps-badge ${getStatusClass(
                            log.status
                          )}`}
                        >
                          {log.status}
                        </span>
                      </td>

                      <td>
                        {incident?.website ? (
                          <div>
                            <div className="font-semibold">
                              {incident.website.name}
                            </div>
                            <div className="text-xs text-[var(--ps-muted-light)]">
                              {incident.website.url}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--ps-ash-light)]">-</span>
                        )}
                      </td>

                      <td>
                        {incident ? (
                          <div>
                            <div className="text-xs text-[var(--ps-muted-light)]">
                              {incident.id}
                            </div>
                            <div className="mt-1 max-w-sm text-[var(--ps-body-light)]">
                              {incident.reason || "-"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[var(--ps-ash-light)]">-</span>
                        )}
                      </td>

                      <td>Telegram</td>

                      <td>
                        {log.sentAt.toLocaleString("id-ID")}
                      </td>

                      <td className="max-w-sm text-[var(--ps-warning)]">
                        {log.errorMessage || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
