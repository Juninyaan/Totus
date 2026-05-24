const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export const apiBaseUrl = configuredApiBaseUrl || (process.env.NODE_ENV === "development" ? "http://localhost:5001/api" : "");
export const hasApiBaseUrl = Boolean(apiBaseUrl);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new ApiError("Frontend-only preview mode: API is not configured.", 503);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const validationDetails = Array.isArray(payload?.errors) ? payload.errors.join("\n") : null;
    const message = validationDetails ? `${payload?.message ?? "Validation failed"}\n${validationDetails}` : (payload?.message ?? "Request failed");
    throw new ApiError(message, response.status);
  }

  return payload as T;
}