// Fetch wrapper that never leaves the UI stuck: network failures and
// non-JSON responses (e.g. a hosting timeout page) become readable errors.
export async function fetchJson<T>(
  input: string,
  init?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(input, init);
    const text = await response.text();

    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    if (!response.ok) {
      const message =
        (body as { error?: string } | null)?.error ||
        `Request failed (${response.status}). Please try again.`;
      return { data: null, error: message };
    }

    if (body === null) {
      return { data: null, error: "Unexpected response from the server." };
    }

    return { data: body as T, error: null };
  } catch {
    return {
      data: null,
      error: "Could not reach the server. Check your connection and try again.",
    };
  }
}
