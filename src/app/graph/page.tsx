import { redirect } from "next/navigation";
import { WebsiteStatus } from "@prisma/client";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import styles from "./graph.module.css";

type GraphPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
  }>;
};

const statusOptions = ["ALL", "UP", "DOWN", "DEGRADED", "PAUSED", "UNKNOWN"];

function getStatusLabel(status: WebsiteStatus) {
  if (status === WebsiteStatus.UP) return "Healthy";
  if (status === WebsiteStatus.DOWN) return "Unhealthy";
  if (status === WebsiteStatus.DEGRADED) return "Degraded";
  if (status === WebsiteStatus.PAUSED) return "Paused";

  return "Unknown";
}

function getSegmentClass(status: WebsiteStatus) {
  if (status === WebsiteStatus.UP) return styles.segmentUp;
  if (status === WebsiteStatus.DOWN) return styles.segmentDown;
  if (status === WebsiteStatus.DEGRADED) return styles.segmentDegraded;
  if (status === WebsiteStatus.PAUSED) return styles.segmentPaused;

  return styles.segmentUnknown;
}

function getBadgeClass(status: WebsiteStatus) {
  if (status === WebsiteStatus.UP) return styles.badgeUp;
  if (status === WebsiteStatus.DOWN) return styles.badgeDown;
  if (status === WebsiteStatus.DEGRADED) return styles.badgeDegraded;
  if (status === WebsiteStatus.PAUSED) return styles.badgePaused;

  return styles.badgeUnknown;
}

function formatAge(date: Date | null) {
  if (!date) return "Never checked";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return `${seconds} seconds ago`;

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours} hours ago`;

  return `${Math.floor(hours / 24)} days ago`;
}

function formatResponseTime(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";

  return `~${value}ms`;
}

function getHostLabel(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export default async function GraphPage({ searchParams }: GraphPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = statusOptions.includes(params.status ?? "")
    ? params.status ?? "ALL"
    : "ALL";
  const sort = params.sort === "status" || params.sort === "latest"
    ? params.sort
    : "name";

  const websites = await prisma.website.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { url: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(status !== "ALL"
        ? { currentStatus: status as WebsiteStatus }
        : {}),
    },
    include: {
      checks: {
        orderBy: {
          checkedAt: "desc",
        },
        take: 56,
      },
    },
  });

  const sortedWebsites = [...websites].sort((left, right) => {
    if (sort === "latest") {
      return (
        (right.lastCheckedAt?.getTime() ?? 0) -
        (left.lastCheckedAt?.getTime() ?? 0)
      );
    }

    if (sort === "status") {
      return left.currentStatus.localeCompare(right.currentStatus);
    }

    return left.name.localeCompare(right.name);
  });

  const healthyCount = websites.filter(
    (website) => website.currentStatus === WebsiteStatus.UP
  ).length;
  const unhealthyCount = websites.filter(
    (website) =>
      website.currentStatus === WebsiteStatus.DOWN ||
      website.currentStatus === WebsiteStatus.DEGRADED
  ).length;

  return (
    <main className="ps-page">
      <section className="ps-hero-dark">
        <div className="ps-container flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="ps-caption text-[var(--ps-body-dark)]">System Monitoring Dashboard</p>
            <h1 className="ps-display-lg mt-3">Health Dashboard</h1>
            <p className="ps-body-md mt-4 text-[var(--ps-body-dark)]">
              Monitor the health of your endpoints in real-time.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="border border-[var(--ps-hairline-dark)] rounded-lg bg-[var(--ps-surface-dark-card)] p-4 text-center">
              <div className="text-2xl font-bold text-white">{sortedWebsites.length}</div>
              <div className="text-sm text-[var(--ps-muted-dark)] mt-1">Endpoints</div>
            </div>
            <div className="border border-[var(--ps-hairline-dark)] rounded-lg bg-[var(--ps-surface-dark-card)] p-4 text-center">
              <div className="text-2xl font-bold text-white">{healthyCount}</div>
              <div className="text-sm text-[var(--ps-muted-dark)] mt-1">Healthy</div>
            </div>
            <div className="border border-[var(--ps-hairline-dark)] rounded-lg bg-[var(--ps-surface-dark-card)] p-4 text-center">
              <div className="text-2xl font-bold text-white">{unhealthyCount}</div>
              <div className="text-sm text-[var(--ps-muted-dark)] mt-1">Needs attention</div>
            </div>
          </div>
        </div>
      </section>

      <section className="ps-container ps-content-stack">
        <form className={styles.toolbar}>
          <label className={styles.search}>
            <span>⌕</span>
            <input
              className={styles.searchInput}
              name="q"
              defaultValue={query}
              placeholder="Search endpoints..."
            />
          </label>

          <label className={styles.select}>
            <span className={styles.selectLabel}>Filter by:</span>
            <select
              className={styles.selectInput}
              name="status"
              defaultValue={status}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "Nothing" : option}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.select}>
            <span className={styles.selectLabel}>Sort by:</span>
            <select className={styles.selectInput} name="sort" defaultValue={sort}>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="latest">Latest check</option>
            </select>
          </label>

          <button className={styles.submit} type="submit">
            Apply
          </button>
        </form>

        {sortedWebsites.length === 0 ? (
          <div className={styles.empty}>Tidak ada endpoint yang cocok.</div>
        ) : (
          <div className={styles.grid}>
            {sortedWebsites.map((website) => {
              const checks = [...website.checks].reverse();
              const latestCheck = website.checks[0] ?? null;
              const segments =
                checks.length > 0
                  ? checks
                  : Array.from({ length: 24 }, (_, index) => ({
                      id: `placeholder-${website.id}-${index}`,
                      status: website.currentStatus,
                      responseTimeMs: null,
                      checkedAt: website.lastCheckedAt ?? website.createdAt,
                    }));

              return (
                <article key={website.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h2 className={styles.cardTitle}>{website.name}</h2>
                      <p className={styles.cardMeta}>
                        {website.type.toLowerCase()} · {getHostLabel(website.url)}
                      </p>
                    </div>

                    <span
                      className={`${styles.badge} ${getBadgeClass(
                        website.currentStatus
                      )}`}
                    >
                      {getStatusLabel(website.currentStatus)}
                    </span>
                  </div>

                  <div className={styles.bars} aria-label={`${website.name} checks`}>
                    {segments.map((check) => (
                      <span
                        key={check.id}
                        className={`${styles.segment} ${getSegmentClass(
                          check.status
                        )}`}
                        title={`${check.status} · ${formatResponseTime(
                          check.responseTimeMs
                        )}`}
                      />
                    ))}
                  </div>

                  <div className={styles.cardFooter}>
                    <span>{formatAge(website.createdAt)}</span>
                    <strong className={styles.responseTime}>
                      {formatResponseTime(latestCheck?.responseTimeMs)}
                    </strong>
                    <span className={styles.lastSeen}>
                      {formatAge(website.lastCheckedAt)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
