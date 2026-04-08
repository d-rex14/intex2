/** Canonical campaign names (INTEX / sample data). `donations.campaign_name` is nullable free text in DB; UI restricts new/edited rows to this list plus legacy values. */
export const FUNDRAISING_CAMPAIGNS = [
  'Year-End Hope',
  'Back to School',
  'Summer of Safety',
  'GivingTuesday',
] as const

export type CampaignSelectOption = {
  value: string
  label: string
}

const CANONICAL_SET = new Set<string>(FUNDRAISING_CAMPAIGNS as unknown as string[])

/**
 * Options for a `<select>`: blank (maps to null in DB), all canonical campaigns, and
 * optionally one extra entry if `currentValue` is non-empty and not in the canonical list.
 */
export function campaignOptionsForSelect(currentValue: string | null | undefined): CampaignSelectOption[] {
  const opts: CampaignSelectOption[] = [{ value: '', label: '— None —' }]
  for (const c of FUNDRAISING_CAMPAIGNS) {
    opts.push({ value: c, label: c })
  }
  const trimmed = (currentValue ?? '').trim()
  if (trimmed && !CANONICAL_SET.has(trimmed)) {
    opts.push({ value: trimmed, label: `${trimmed} (from record)` })
  }
  return opts
}
