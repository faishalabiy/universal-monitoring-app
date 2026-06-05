import { Website, WebsiteStatus } from "@prisma/client";

export type WebsiteCheckResult = {
  status: WebsiteStatus;
  statusCode: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
};

export async function checkWebsite(
  website: Website
): Promise<WebsiteCheckResult> {
  const startedAt = Date.now();

  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, website.timeoutSeconds * 1000);

    const response = await fetch(website.url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "MonitoringApp/1.0",
      },
    });

    clearTimeout(timeout);

    const responseTimeMs = Date.now() - startedAt;
    const statusCode = response.status;

    if (statusCode !== website.expectedStatusCode) {
      return {
        status: WebsiteStatus.DOWN,
        statusCode,
        responseTimeMs,
        errorMessage: `Expected status ${website.expectedStatusCode}, got ${statusCode}`,
      };
    }

    if (website.expectedKeyword) {
      const body = await response.text();

      if (!body.includes(website.expectedKeyword)) {
        return {
          status: WebsiteStatus.DOWN,
          statusCode,
          responseTimeMs,
          errorMessage: `Expected keyword not found: ${website.expectedKeyword}`,
        };
      }
    }

    if (responseTimeMs > website.degradedThresholdMs) {
      return {
        status: WebsiteStatus.DEGRADED,
        statusCode,
        responseTimeMs,
        errorMessage: `Response time exceeded threshold: ${responseTimeMs}ms > ${website.degradedThresholdMs}ms`,
      };
    }

    return {
      status: WebsiteStatus.UP,
      statusCode,
      responseTimeMs,
      errorMessage: null,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startedAt;

    let errorMessage = "Unknown error";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = `Request timeout after ${website.timeoutSeconds}s`;
      } else {
        errorMessage = error.message;
      }
    }

    return {
      status: WebsiteStatus.DOWN,
      statusCode: null,
      responseTimeMs,
      errorMessage,
    };
  }
}