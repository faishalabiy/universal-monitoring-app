"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type WebsiteFormInitialData = {
  id: string;
  name: string;
  url: string;
  checkIntervalSeconds: number;
  timeoutSeconds: number;
  expectedStatusCode: number;
  expectedKeyword: string | null;
  degradedThresholdMs: number;
};

type WebsiteFormProps = {
  mode?: "create" | "edit";
  initialData?: WebsiteFormInitialData;
};

export default function WebsiteForm({
  mode = "create",
  initialData,
}: WebsiteFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [checkIntervalSeconds, setCheckIntervalSeconds] = useState(
    initialData?.checkIntervalSeconds ?? 60
  );
  const [timeoutSeconds, setTimeoutSeconds] = useState(
    initialData?.timeoutSeconds ?? 10
  );
  const [expectedStatusCode, setExpectedStatusCode] = useState(
    initialData?.expectedStatusCode ?? 200
  );
  const [expectedKeyword, setExpectedKeyword] = useState(
    initialData?.expectedKeyword ?? ""
  );
  const [degradedThresholdMs, setDegradedThresholdMs] = useState(
    initialData?.degradedThresholdMs ?? 5000
  );

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const endpoint =
        mode === "edit" && initialData
          ? `/api/websites/${initialData.id}`
          : "/api/websites";

      const method = mode === "edit" ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
          checkIntervalSeconds,
          timeoutSeconds,
          expectedStatusCode,
          expectedKeyword,
          degradedThresholdMs,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Gagal menyimpan website.");
        return;
      }

      if (mode === "edit" && initialData) {
        router.push(`/websites/${initialData.id}`);
      } else {
        router.push("/websites");
      }

      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="ps-card max-w-3xl space-y-6 p-6"
    >
      <div>
        <label className="ps-caption font-semibold">Nama Website</label>
        <input
          className="ps-input mt-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Company Profile"
        />
      </div>

      <div>
        <label className="ps-caption font-semibold">URL</label>
        <input
          className="ps-input mt-2"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="ps-caption font-semibold">Interval Check</label>
          <input
            type="number"
            className="ps-input mt-2"
            value={checkIntervalSeconds}
            onChange={(event) =>
              setCheckIntervalSeconds(Number(event.target.value))
            }
            min={30}
          />
          <p className="mt-1 text-xs text-[var(--ps-muted-light)]">Minimal 30 detik</p>
        </div>

        <div>
          <label className="ps-caption font-semibold">Timeout</label>
          <input
            type="number"
            className="ps-input mt-2"
            value={timeoutSeconds}
            onChange={(event) => setTimeoutSeconds(Number(event.target.value))}
            min={3}
          />
          <p className="mt-1 text-xs text-[var(--ps-muted-light)]">Minimal 3 detik</p>
        </div>

        <div>
          <label className="ps-caption font-semibold">Expected Status</label>
          <input
            type="number"
            className="ps-input mt-2"
            value={expectedStatusCode}
            onChange={(event) =>
              setExpectedStatusCode(Number(event.target.value))
            }
            min={100}
            max={599}
          />
        </div>
      </div>

      <div>
        <label className="ps-caption font-semibold">Expected Keyword</label>
        <input
          className="ps-input mt-2"
          value={expectedKeyword}
          onChange={(event) => setExpectedKeyword(event.target.value)}
          placeholder="Opsional"
        />
        <p className="mt-1 text-xs text-[var(--ps-muted-light)]">
          Kosongkan jika tidak perlu mengecek keyword tertentu.
        </p>
      </div>

      <div>
        <label className="ps-caption font-semibold">Degraded Threshold</label>
        <input
          type="number"
          className="ps-input mt-2"
          value={degradedThresholdMs}
          onChange={(event) =>
            setDegradedThresholdMs(Number(event.target.value))
          }
          min={1000}
        />
        <p className="mt-1 text-xs text-[var(--ps-muted-light)]">
          Jika response time melewati nilai ini, status menjadi DEGRADED.
        </p>
      </div>

      {error ? (
        <div className="rounded-[var(--ps-radius-sm)] border border-[rgba(200,27,58,0.22)] bg-[rgba(200,27,58,0.08)] px-4 py-3 text-sm text-[var(--ps-warning)]">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="ps-button-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Menyimpan..."
            : mode === "edit"
            ? "Simpan Perubahan"
            : "Simpan Website"}
        </button>

        <button
          type="button"
          onClick={() =>
            mode === "edit" && initialData
              ? router.push(`/websites/${initialData.id}`)
              : router.push("/websites")
          }
          className="ps-button-secondary"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
