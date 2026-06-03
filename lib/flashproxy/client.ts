import { getEnv } from "@/lib/env";
import { FlashProxyError } from "@/lib/flashproxy/errors";
import type {
  FlashProxyFailureResponse,
  FlashProxyQuery,
  FlashProxyRequestOptions,
  FlashProxyResponse,
  FlashProxyResult,
} from "@/lib/flashproxy/types";

const DEFAULT_ERROR_MESSAGE = "FlashProxy request failed";

function buildUrl(path: string, query?: FlashProxyQuery) {
  const baseUrl = getEnv().FLASHPROXY_API_BASE_URL.replace(/\/$/, "");
  const url = new URL(`${baseUrl}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }

      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function isFailureResponse(
  value: unknown
): value is FlashProxyFailureResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    (value as { success: unknown }).success === false
  );
}

function unwrapData<TData>(payload: FlashProxyResponse<TData>) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    (payload as { success: unknown }).success === true &&
    "data" in payload
  ) {
    return (payload as { data: TData }).data;
  }

  return payload as TData;
}

function normalizeErrorPayload(payload: unknown) {
  if (isFailureResponse(payload)) {
    return {
      code: payload.error?.code ?? "FLASHPROXY_ERROR",
      message: payload.error?.message ?? DEFAULT_ERROR_MESSAGE,
      details: payload.error?.details,
    };
  }

  return {
    code: "FLASHPROXY_ERROR",
    message: DEFAULT_ERROR_MESSAGE,
    details: payload,
  };
}

export async function flashProxyRequest<TData, TBody = unknown>({
  apiKey,
  method,
  path,
  query,
  body,
  idempotencyKey,
  signal,
}: FlashProxyRequestOptions<TBody>): Promise<FlashProxyResult<TData>> {
  const startedAt = performance.now();
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  });

  let requestBody: string | undefined;

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  if (idempotencyKey) {
    headers.set("X-Idempotency-Key", idempotencyKey);
  }

  let response!: Response;
  let payload: unknown;

  let attempt = 0;
  const maxRetries = method === "GET" ? 2 : 0;

  while (true) {
    attempt++;
    try {
      response = await fetch(buildUrl(path, query), {
        method,
        headers,
        body: requestBody,
        cache: "no-store",
        signal,
      });

      const contentType = response.headers.get("content-type") ?? "";
      payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    } catch (error) {
      if (attempt <= maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        continue;
      }
      throw new FlashProxyError({
        status: 0,
        code: "NETWORK_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach FlashProxy API",
        durationMs: Math.round(performance.now() - startedAt),
      });
    }

    if (!response.ok && attempt <= maxRetries && [502, 503, 504].includes(response.status)) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      continue;
    }

    break;
  }

  const durationMs = Math.round(performance.now() - startedAt);

  if (!response.ok || isFailureResponse(payload)) {
    const normalized = normalizeErrorPayload(payload);

    throw new FlashProxyError({
      status: response.status,
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
      durationMs,
    });
  }

  return {
    data: unwrapData<TData>(payload as FlashProxyResponse<TData>),
    status: response.status,
    durationMs,
  };
}
