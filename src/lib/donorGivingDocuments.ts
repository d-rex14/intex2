import { ORG } from '../content/org'

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function downloadTextFile(filename: string, content: string, mime = 'text/html;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const docStyles = `
  body { font-family: system-ui, Segoe UI, Roboto, sans-serif; color: #111; max-width: 640px; margin: 24px auto; padding: 0 16px; line-height: 1.45; }
  h1 { font-size: 1.25rem; margin: 0 0 8px; }
  .muted { color: #555; font-size: 0.875rem; }
  .box { border: 1px solid #ccc; border-radius: 8px; padding: 16px; margin: 16px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #e5e5e5; }
  th { font-weight: 600; color: #333; }
  .total { font-weight: 700; font-size: 1rem; margin-top: 12px; }
  .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 0.75rem; color: #666; }
  @media print { body { margin: 0; } .no-print { display: none; } }
`

export type InvoiceDonationInput = {
  donationId: number
  donationDate: string | null
  donationType: string | null
  currencyCode: string | null
  amount: number | null
  estimatedValue: number | null
  impactUnit: string | null
  channelSource: string | null
  campaignName: string | null
  isRecurring: boolean | null
  notes: string | null
}

export function buildDonationInvoiceHtml(params: {
  donation: InvoiceDonationInput
  donorDisplayName: string
  donorEmail: string
  amountLabel: string
  generatedAtIso: string
}): string {
  const { donation, donorDisplayName, donorEmail, amountLabel, generatedAtIso } = params
  const dateStr = (donation.donationDate ?? '').slice(0, 10) || '—'
  const type = escapeHtml((donation.donationType ?? 'Gift').trim() || 'Gift')
  const channel = escapeHtml((donation.channelSource ?? '').trim() || '—')
  const campaign = donation.campaignName?.trim()
  const recurring = donation.isRecurring ? 'Yes' : 'No'
  const notes = donation.notes?.trim()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Charitable gift receipt — ${escapeHtml(String(donation.donationId))}</title>
  <style>${docStyles}</style>
</head>
<body>
  <p class="muted no-print">Use your browser’s Print dialog to save as PDF for your records.</p>
  <h1>Gift acknowledgment</h1>
  <p class="muted">Lighthouse Sanctuary · EIN ${escapeHtml(ORG.ein)} · 501(c)(3) nonprofit</p>
  <p class="muted">Questions: ${escapeHtml(ORG.emailContact)} · ${escapeHtml(ORG.phoneDisplay)}</p>

  <div class="box">
    <p><strong>Receipt no.</strong> WT-DON-${donation.donationId}</p>
    <p><strong>Date of gift</strong> ${escapeHtml(dateStr)}</p>
    <p><strong>Donor</strong> ${escapeHtml(donorDisplayName)}</p>
    <p><strong>Email on file</strong> ${escapeHtml(donorEmail)}</p>
    <p><strong>Amount / description</strong> ${escapeHtml(amountLabel)}</p>
    <p><strong>Gift type</strong> ${type}</p>
    <p><strong>Channel</strong> ${channel}</p>
    <p><strong>Recurring</strong> ${recurring}</p>
    ${campaign ? `<p><strong>Campaign</strong> ${escapeHtml(campaign)}</p>` : ''}
    ${notes ? `<p><strong>Notes</strong> ${escapeHtml(notes)}</p>` : ''}
  </div>

  <p>No goods or services were provided in exchange for this charitable contribution, except as required by law to be stated separately.</p>
  <p class="muted">This acknowledgment is for your records only. Consult a tax advisor for how this applies to your situation.</p>

  <div class="footer">
    <p>Document generated ${escapeHtml(generatedAtIso)} from your Watchtower donor portal.</p>
  </div>
</body>
</html>`
}

export type YtdRowInput = {
  donationId: number
  donationDate: string | null
  donationType: string | null
  currencyCode: string | null
  amountLabel: string
  channelSource: string | null
}

export function buildYtdReportHtml(params: {
  year: number
  donorDisplayName: string
  donorEmail: string
  rows: YtdRowInput[]
  summaryLines: string[]
  generatedAtIso: string
}): string {
  const { year, donorDisplayName, donorEmail, rows, summaryLines, generatedAtIso } = params
  const rowHtml = rows
    .map(
      r => `<tr>
      <td>${escapeHtml((r.donationDate ?? '').slice(0, 10) || '—')}</td>
      <td>${escapeHtml(r.donationType ?? '—')}</td>
      <td>${escapeHtml(r.amountLabel)}</td>
      <td>${escapeHtml((r.currencyCode ?? '').trim() || '—')}</td>
      <td>${escapeHtml((r.channelSource ?? '').trim() || '—')}</td>
      <td>${r.donationId}</td>
    </tr>`,
    )
    .join('')

  const summaryHtml = summaryLines.map(l => `<p class="total">${escapeHtml(l)}</p>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Year-to-date giving ${year}</title>
  <style>${docStyles}</style>
</head>
<body>
  <p class="muted no-print">Use Print → Save as PDF if you need a PDF copy for your tax preparer.</p>
  <h1>Year-to-date charitable giving</h1>
  <p class="muted">Calendar year <strong>${year}</strong></p>
  <p><strong>Donor</strong> ${escapeHtml(donorDisplayName)}</p>
  <p><strong>Email</strong> ${escapeHtml(donorEmail)}</p>
  <p class="muted">Organization: Lighthouse Sanctuary (EIN ${escapeHtml(ORG.ein)})</p>

  ${summaryHtml}

  <div class="box" style="margin-top: 20px;">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Amount / qty</th>
          <th>Currency</th>
          <th>Channel</th>
          <th>ID</th>
        </tr>
      </thead>
      <tbody>
        ${rowHtml || '<tr><td colspan="6">No gifts in this period.</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Totals reflect gifts recorded in our system for your account. Currency conversions (if shown) are approximate for convenience.</p>
    <p>Generated ${escapeHtml(generatedAtIso)} from the Watchtower donor portal.</p>
  </div>
</body>
</html>`
}

export function buildYtdReportCsv(params: {
  year: number
  donorDisplayName: string
  donorEmail: string
  rows: YtdRowInput[]
}): string {
  const { year, donorDisplayName, donorEmail, rows } = params
  const header = ['Year', 'Donor', 'Email', 'Date', 'Type', 'AmountDescription', 'Currency', 'Channel', 'DonationId']
  const lines = [
    header.join(','),
    ...rows.map(r =>
      [
        String(year),
        csvEscape(donorDisplayName),
        csvEscape(donorEmail),
        csvEscape((r.donationDate ?? '').slice(0, 10)),
        csvEscape(r.donationType ?? ''),
        csvEscape(r.amountLabel),
        csvEscape((r.currencyCode ?? '').trim()),
        csvEscape((r.channelSource ?? '').trim()),
        String(r.donationId),
      ].join(','),
    ),
  ]
  return lines.join('\r\n')
}

function csvEscape(s: string): string {
  const t = s.replace(/"/g, '""')
  if (/[",\r\n]/.test(t)) return `"${t}"`
  return t
}
