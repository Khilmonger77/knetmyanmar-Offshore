/** Parse user input like "$1,250", "1250.50", or ".99" into integer cents. */
export function parseDollarsToCents(value: string): number | null {
  let t = value.trim().replace(/[$€£\s,]/g, '')
  if (!t) return null
  if (t.startsWith('.')) t = `0${t}`
  if (!/^\d+(\.\d{0,2})?$/.test(t)) return null
  const [whole, frac = ''] = t.split('.')
  const f = (frac + '00').slice(0, 2)
  const cents = Number(whole) * 100 + Number(f)
  return Number.isFinite(cents) && cents >= 0 ? cents : null
}

export function formatCents(cents: number): string {
  const neg = cents < 0
  const n = Math.abs(Math.round(cents))
  const d = Math.floor(n / 100)
  const c = n % 100
  const s = d.toLocaleString('en-US', { maximumFractionDigits: 0 })
  const out = `${s}.${c.toString().padStart(2, '0')}`
  return neg ? `-${out}` : out
}

export function formatCurrency(cents: number): string {
  const neg = cents < 0
  const body = formatCents(Math.abs(cents))
  return neg ? `-$${body}` : `$${body}`
}
