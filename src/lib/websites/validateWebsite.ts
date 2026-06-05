export type WebsiteInput = {
  name: string;
  url: string;
  checkIntervalSeconds: number;
  timeoutSeconds: number;
  expectedStatusCode: number;
  expectedKeyword?: string | null;
  degradedThresholdMs: number;
};

export function validateWebsiteInput(body: unknown): {
  data?: WebsiteInput;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return { error: "Payload tidak valid." };
  }

  const payload = body as Record<string, unknown>;

  const name = String(payload.name || "").trim();
  const url = String(payload.url || "").trim();
  const checkIntervalSeconds = Number(payload.checkIntervalSeconds || 60);
  const timeoutSeconds = Number(payload.timeoutSeconds || 10);
  const expectedStatusCode = Number(payload.expectedStatusCode || 200);
  const expectedKeyword =
    payload.expectedKeyword === undefined || payload.expectedKeyword === null
      ? null
      : String(payload.expectedKeyword).trim();
  const degradedThresholdMs = Number(payload.degradedThresholdMs || 5000);

  if (!name) {
    return { error: "Nama website wajib diisi." };
  }

  if (!url) {
    return { error: "URL website wajib diisi." };
  }

  try {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return { error: "URL harus menggunakan http atau https." };
    }
  } catch {
    return { error: "Format URL tidak valid." };
  }

  if (!Number.isInteger(checkIntervalSeconds) || checkIntervalSeconds < 30) {
    return { error: "Interval pengecekan minimal 30 detik." };
  }

  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 3) {
    return { error: "Timeout minimal 3 detik." };
  }

  if (
    !Number.isInteger(expectedStatusCode) ||
    expectedStatusCode < 100 ||
    expectedStatusCode > 599
  ) {
    return { error: "Expected status code harus antara 100 sampai 599." };
  }

  if (!Number.isInteger(degradedThresholdMs) || degradedThresholdMs < 1000) {
    return { error: "Degraded threshold minimal 1000 ms." };
  }

  return {
    data: {
      name,
      url,
      checkIntervalSeconds,
      timeoutSeconds,
      expectedStatusCode,
      expectedKeyword: expectedKeyword || null,
      degradedThresholdMs,
    },
  };
}