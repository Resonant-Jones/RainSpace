import type { DataMode } from '../data/types'

/**
 * Build-time configuration.
 *
 * `VITE_DATA_MODE` decides where storefront data comes from:
 *
 * - `fixtures` (default) - bundled placeholder data. The storefront is fully
 *   demonstrable with no backend running. This is what Netlify deploys.
 * - `api` - live reads from the FastAPI service at `VITE_API_BASE_URL`.
 *
 * Every value here is a public, build-time constant. Nothing secret may be
 * placed in a `VITE_*` variable: it is inlined into the client bundle.
 */

export const DATA_MODE: DataMode =
  import.meta.env.VITE_DATA_MODE === 'api' ? 'api' : 'fixtures'

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const CREATOR_SLUG: string = import.meta.env.VITE_CREATOR_SLUG ?? 'demo'
