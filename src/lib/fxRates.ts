export const BASE_CURRENCY = 'PHP' as const

/**
 * Static, approximate FX rates to PHP.
 * Keep this small and adjust as needed for your dataset.
 */
export const FX_TO_PHP: Record<string, number> = {
  PHP: 1,
  USD: 56,
  EUR: 61,
  GBP: 72,
  AUD: 37,
  CAD: 41,
  JPY: 0.37,
}

export function toPHP(
  amount: number,
  currencyCode: string | null | undefined,
): { php: number | null; rateUsed: number | null } {
  const cur = (currencyCode ?? BASE_CURRENCY).trim().toUpperCase()
  const rate = FX_TO_PHP[cur]
  if (!Number.isFinite(amount)) return { php: null, rateUsed: null }
  if (!Number.isFinite(rate)) return { php: null, rateUsed: null }
  return { php: amount * rate, rateUsed: rate }
}

