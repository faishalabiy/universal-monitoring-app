"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Report = {
  range: "24h" | "7d" | "30d";
  totalChecks: number;
  upChecks: number;
  problemChecks: number;
  unknownChecks: number;
  uptimePercentage: number | null;
  problemPercentage: number | null;
  averageResponseTimeMs: number | null;
  minResponseTimeMs: number | null;
  maxResponseTimeMs: number | null;
};

type ResponseTimePoint = {
  id: string;
  status: string;
  responseTimeMs: number | null;
  checkedAt: string;
};

type ApiResponse = {
  data: {
    selectedRange: "24h" | "7d" | "30d";
    uptimeReport: Report[];
    responseTimeSeries: ResponseTimePoint[];
  };
};

type WebsiteReportPanelProps = {
  websiteId: string;
};

function formatPercentage(value: number | null) {
  if (value === null) return "-";
  return `${value}%`;
}

function formatMs(value: number | null) {
  if (value === null) return "-";
  return `${value}ms`;
}

function formatChartTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WebsiteReportPanel({
  websiteId,
}: WebsiteReportPanelProps) {
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");
  const [data, setData] = useState<ApiResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadReport() {
      setLoading(true);

      const response = await fetch(`/api/websites/${websiteId}/report?range=${range}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const json = (await response.json()) as ApiResponse;

      if (!ignore) {
        setData(json.data);
        setLoading(false);
      }
    }

    loadReport();

    return () => {
      ignore = true;
    };
  }, [websiteId, range]);

  const chartData = useMemo(() => {
    return (
      data?.responseTimeSeries
        .filter((point) => point.responseTimeMs !== null)
        .map((point) => ({
          checkedAt: formatChartTime(point.checkedAt),
          responseTimeMs: point.responseTimeMs,
          status: point.status,
        })) ?? []
    );
  }, [data]);

  return (
    <section className="ps-card p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="ps-heading-md">Uptime Report</h2>
          <p className="ps-caption mt-1 text-[var(--ps-muted-light)]">
            Ringkasan uptime dan response time endpoint.
          </p>
        </div>

        <select
          className="rounded-lg border border-[var(--ps-hairline-light)] bg-[var(--ps-surface-card)] px-3 py-2 text-sm text-[var(--ps-ink)]"
          value={range}
          onChange={(event) => setRange(event.target.value as "24h" | "7d" | "30d")}
        >
          <option value="24h">24 jam</option>
          <option value="7d">7 hari</option>
          <option value="30d">30 hari</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-[var(--ps-body-light)]">Memuat report...</div>
      ) : !data ? (
        <div className="text-sm text-[var(--ps-body-light)]">
          Report tidak tersedia.
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {data.uptimeReport.map((report) => (
              <div key={report.range} className="ps-card-soft p-4">
                <p className="ps-caption text-[var(--ps-muted-light)]">
                  {report.range === "24h"
                    ? "24 Jam"
                    : report.range === "7d"
                    ? "7 Hari"
                    : "30 Hari"}
                </p>

                <p className="mt-2 text-2xl font-bold text-[var(--ps-ink)]">
                  {formatPercentage(report.uptimePercentage)}
                </p>

                <div className="mt-3 space-y-1 text-sm text-[var(--ps-body-light)]">
                  <div>Total checks: {report.totalChecks}</div>
                  <div>Problem checks: {report.problemChecks}</div>
                  <div>Avg response: {formatMs(report.averageResponseTimeMs)}</div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-[var(--ps-ink)]">
              Response Time Chart
            </h3>

            {chartData.length === 0 ? (
              <div className="rounded-lg border border-[var(--ps-hairline-light)] p-5 text-sm text-[var(--ps-body-light)]">
                Belum ada data response time untuk range ini.
              </div>
            ) : (
              <div className="h-72 rounded-lg border border-[var(--ps-hairline-light)] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="checkedAt" hide />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="responseTimeMs"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}