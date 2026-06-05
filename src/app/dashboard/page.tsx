import { redirect } from "next/navigation";
import { IncidentStatus, WebsiteStatus } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import RealtimeDashboard from "@/components/dashboard/RealtimeDashboard";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [
    totalWebsites,
    upWebsites,
    downWebsites,
    degradedWebsites,
    pausedWebsites,
    unknownWebsites,
    activeIncidents,
    recentWebsites,
    activeIncidentList,
  ] = await Promise.all([
    prisma.website.count(),
    prisma.website.count({
      where: { currentStatus: WebsiteStatus.UP },
    }),
    prisma.website.count({
      where: { currentStatus: WebsiteStatus.DOWN },
    }),
    prisma.website.count({
      where: { currentStatus: WebsiteStatus.DEGRADED },
    }),
    prisma.website.count({
      where: { currentStatus: WebsiteStatus.PAUSED },
    }),
    prisma.website.count({
      where: { currentStatus: WebsiteStatus.UNKNOWN },
    }),
    prisma.incident.count({
      where: { status: IncidentStatus.ACTIVE },
    }),
    prisma.website.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.incident.findMany({
      where: { status: IncidentStatus.ACTIVE },
      orderBy: { startedAt: "desc" },
      take: 8,
      include: {
        website: true,
      },
    }),
  ]);

  const initialData = {
    totalWebsites,
    upWebsites,
    downWebsites,
    degradedWebsites,
    pausedWebsites,
    unknownWebsites,
    activeIncidents,
    recentWebsites: recentWebsites.map((website) => ({
      id: website.id,
      name: website.name,
      url: website.url,
      currentStatus: website.currentStatus,
      lastCheckedAt: website.lastCheckedAt?.toISOString() ?? null,
    })),
    activeIncidentList: activeIncidentList.map((incident) => ({
      id: incident.id,
      reason: incident.reason,
      startedAt: incident.startedAt.toISOString(),
      durationSeconds: incident.durationSeconds,
      website: {
        id: incident.website.id,
        name: incident.website.name,
        url: incident.website.url,
      },
    })),
  };

  return (
    <main className="ps-page">
      <section className="ps-hero-dark">
        <div className="ps-container flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="ps-caption text-[var(--ps-body-dark)]">
              Login sebagai {session.name} ({session.role})
            </p>
            <h1 className="ps-display-lg mt-3">Dashboard Monitoring</h1>
            <p className="ps-body-md mt-4 max-w-xl text-[var(--ps-body-dark)]">
              Pantau kesehatan website, incident aktif, dan event realtime dalam
              satu permukaan operasional.
            </p>
          </div>

          <div className="rounded-full border border-[var(--ps-hairline-dark)] px-4 py-2 text-sm font-semibold text-[var(--ps-body-dark)]">
            Realtime worker surface
          </div>
        </div>
      </section>

      <div className="ps-container ps-content-stack">
        <RealtimeDashboard initialData={initialData} />
      </div>
    </main>
  );
}
