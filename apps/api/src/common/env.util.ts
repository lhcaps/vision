export function envOrDefault(key: string, fallback: string): string {
  const v = process.env[key];
  if (v === undefined || v === null || v === '') return fallback;
  return v;
}

export function envIntOrDefault(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === null || v === '') return fallback;
  const parsed = Number.parseInt(v, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function envBoolOrDefault(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === null || v === '') return fallback;
  return v === '1' || v.toLowerCase() === 'true';
}
