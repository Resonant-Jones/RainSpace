/** Presentation helpers shared by storefront and creator console. */

/**
 * Format a price held in minor currency units.
 *
 * The number of minor units per major unit is derived from the currency
 * itself (100 for USD, 0 for JPY, 1000 for KWD), so the platform does not
 * hard-code a two-decimal assumption.
 */
export function formatPrice(minorUnits: number, currency: string): string {
  if (minorUnits <= 0) return 'Free'
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    })
    const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2
    return formatter.format(minorUnits / 10 ** digits)
  } catch {
    return `${minorUnits} ${currency}`
  }
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '--:--'
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

/**
 * Parse a date value.
 *
 * A date-only value ("2026-11-23") is a calendar date, not an instant.
 * `new Date('2026-11-23')` would parse it as UTC midnight and then render as
 * the previous day in any timezone behind UTC, so date-only values are
 * parsed as local time instead.
 */
function parseDate(value: string): Date | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return new Date(Number(year), Number(month) - 1, Number(day))
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value: string | null): string {
  if (!value) return 'Unscheduled'
  const date = parseDate(value)
  if (!date) return value
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Deterministic 32-bit hash, used to derive stable placeholder artwork. */
export function hashString(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}
