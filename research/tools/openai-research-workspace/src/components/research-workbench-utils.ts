export function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed.");
  }
  return data;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAliases(aliases: string[]): string[] {
  const cleaned = aliases
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);
  return [...new Set(cleaned)];
}
