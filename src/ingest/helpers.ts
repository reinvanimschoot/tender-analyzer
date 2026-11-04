export const BASE = "https://www.publicprocurement.be";

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

export async function apiRequest(
  token: string,
  path: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "BelGov-Trace-Id": crypto.randomUUID(),
  };

  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? null : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `${options.method ?? "GET"} ${path} failed: ${response.status} ${text}`,
    );
  }

  return response.json();
}
