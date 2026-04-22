/** Build a tel: link from a display phone number (digits preserved). */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return '#'
  return `tel:+${digits}`
}
