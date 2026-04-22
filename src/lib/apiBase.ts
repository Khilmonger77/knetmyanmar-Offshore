/**
 * Base URL for API calls (prepended to `/api/...`).
 *
 * In dev, leave env vars empty so requests stay same-origin and Vite’s `/api` proxy
 * forwards to NOTIFY_PORT. If `VITE_API_BASE` is set to this dev server’s origin
 * (e.g. `http://localhost:5173`), some setups return HTML 404 instead of JSON —
 * we treat that as “use the proxy” and return an empty base.
 */
export function getApiBase(): string {
  const raw =
    import.meta.env.VITE_API_BASE ?? import.meta.env.VITE_NOTIFY_API_BASE ?? ''
  const base = String(raw).replace(/\/$/, '')

  if (!import.meta.env.DEV) {
    return base
  }

  if (!base) {
    return ''
  }

  if (typeof window !== 'undefined') {
    try {
      const resolved = new URL(base)
      if (resolved.origin === window.location.origin) {
        return ''
      }
    } catch {
      /* invalid URL — fall through */
    }
  }

  return base
}

/**
 * For images and other static files under `/api/media/...` when the UI is on
 * another origin (e.g. Netlify + API on a tunnel), prepend `VITE_API_BASE`.
 */
export function resolvePublicMediaUrl(src: string): string {
  const s = String(src ?? '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('/api/')) {
    const base = getApiBase().replace(/\/$/, '')
    return base ? `${base}${s}` : s
  }
  return s
}
