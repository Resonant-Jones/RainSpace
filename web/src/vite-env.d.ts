/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `fixtures` (default) or `api`. */
  readonly VITE_DATA_MODE?: string
  /** Public base URL of the FastAPI service. Only used in `api` mode. */
  readonly VITE_API_BASE_URL?: string
  /** Slug of the creator whose storefront is rendered. */
  readonly VITE_CREATOR_SLUG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
