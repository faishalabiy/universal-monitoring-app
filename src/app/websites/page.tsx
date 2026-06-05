import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import WebsiteActions from "@/components/websites/WebsiteActions";

function getStatusClass(status: string) {
  if (status === "UP") return "ps-status-up";
  if (status === "DOWN") return "ps-status-down";
  if (status === "DEGRADED")
    return "ps-status-degraded";
  if (status === "PAUSED") return "ps-status-paused";

  return "ps-status-unknown";
}

export default async function WebsitesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const websites = await prisma.website.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="ps-page">
      <section className="ps-hero-dark">
        <div className="ps-container flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="ps-display-lg">Websites</h1>
            <p className="ps-body-md mt-4 text-[var(--ps-body-dark)]">
              Daftar website yang sedang dimonitor, lengkap dengan interval,
              timeout, dan status pengecekan terakhir.
            </p>
          </div>

          <Link href="/websites/new" className="ps-button-primary">
            Tambah Website
          </Link>
        </div>
      </section>

      <div className="ps-container ps-content-stack">
        <div className="ps-card overflow-hidden">
        {websites.length === 0 ? (
          <div className="p-6 text-sm text-[var(--ps-body-light)]">
            Belum ada website. Klik tombol <strong>Tambah Website</strong> untuk
            mulai.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Interval</th>
                  <th>Timeout</th>
                  <th>Last Checked</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {websites.map((website) => (
                  <tr key={website.id}>
                    <td className="font-semibold">{website.name}</td>
                    <td>
                      <a
                        href={website.url}
                        target="_blank"
                        className="ps-link"
                      >
                        {website.url}
                      </a>
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
                      {website.checkIntervalSeconds}s
                    </td>
                    <td>{website.timeoutSeconds}s</td>
                    <td>
                      {website.lastCheckedAt
                        ? website.lastCheckedAt.toLocaleString("id-ID")
                        : "-"}
                    </td>

                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/websites/${website.id}`}
                          className="ps-button-secondary ps-button-compact"
                        >
                          View
                        </Link>

                        <Link
                          href={`/websites/${website.id}/edit`}
                          className="ps-button-secondary ps-button-compact"
                        >
                          Edit
                        </Link>

                        <WebsiteActions
                          websiteId={website.id}
                          websiteName={website.name}
                          isActive={website.isActive}
                        />
                      </div>
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
