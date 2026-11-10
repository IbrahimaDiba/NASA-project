// ============================================================================
// Lunar Horizon — Formatters and Unit Conversion Utilities
// ============================================================================

export function formatDegrees(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(decimals)}°`;
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${Math.round(val)}%`;
}

export function formatElevation(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || isNaN(meters)) return '—';
  if (Math.abs(meters) >= 1000) {
    return `${(meters / 1000).toFixed(2)} km (${meters.toFixed(0)} m)`;
  }
  return `${meters.toFixed(0)} m`;
}

export function formatDurationHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return 'Continuous';
  if (hours < 0) return '0 hrs';
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  if (days > 0) {
    return `${days}d ${remainingHours}h`;
  }
  return `${remainingHours} hrs`;
}

export function formatUtcDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
  } catch {
    return dateStr;
  }
}
