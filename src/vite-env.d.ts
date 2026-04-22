/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL for backend APIs when not same-origin. Leave empty in dev (Vite proxies /api).
   * Do not set this to the Vite dev URL (e.g. http://localhost:5173); same-origin is forced to relative URLs.
   * Production: leave empty if the UI is served from the same host as /api (npm start + dist/).
   * Set to your API origin (e.g. https://api.example.com) when the static site is on another domain.
   */
  readonly VITE_API_BASE?: string
  /** @deprecated Prefer VITE_API_BASE */
  readonly VITE_NOTIFY_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
