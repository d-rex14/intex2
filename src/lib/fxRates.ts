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

export const SUPPORTED_CURRENCIES = Object.keys(FX_TO_PHP).sort()

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

export function convertCurrency(
  amount: number,
  fromCurrencyCode: string | null | undefined,
  toCurrencyCode: string | null | undefined,
): { converted: number | null; rateUsed: number | null } {
  if (!Number.isFinite(amount)) return { converted: null, rateUsed: null }

  const from = (fromCurrencyCode ?? BASE_CURRENCY).trim().toUpperCase() || BASE_CURRENCY
  const to = (toCurrencyCode ?? BASE_CURRENCY).trim().toUpperCase() || BASE_CURRENCY

  const fromToPHP = FX_TO_PHP[from]
  const toToPHP = FX_TO_PHP[to]
  if (!Number.isFinite(fromToPHP) || !Number.isFinite(toToPHP)) return { converted: null, rateUsed: null }

  // amount(from) -> PHP -> amount(to)
  const php = amount * fromToPHP
  const converted = php / toToPHP
  const rateUsed = fromToPHP / toToPHP
  return { converted, rateUsed }
}

