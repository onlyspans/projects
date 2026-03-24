export function parseEnvironmentIds(raw: string): string[] {
  if (!raw || raw.trim() === '') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function serializeEnvironmentIds(ids: string[]): string {
  return ids.join(',');
}
