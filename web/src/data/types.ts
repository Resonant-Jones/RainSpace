/**
 * Shared data contracts.
 *
 * The frontend never talks to the database and never holds a storage object
 * key. The shapes below mirror the public API payloads exactly so the
 * fixtures source and the API source are interchangeable.
 */

export type DataMode = 'fixtures' | 'api'

export interface Theme {
  primary: string
  accent: string
  background: string
  surface: string
  text: string
  muted: string
}

export interface Creator {
  slug: string
  display_name: string
  tagline: string | null
  theme: Theme
  created_at: string
}

export interface PublicMedia {
  asset_type: string
  mime_type: string
  duration_seconds: number | null
}

export interface ContentSummary {
  slug: string
  title: string
  description: string | null
  price_minor_units: number
  currency: string
  published_at: string | null
  duration_seconds: number | null
  media: PublicMedia[]
}

export type ContentDetail = ContentSummary

/**
 * The single boundary between the UI and wherever content comes from.
 *
 * Implementations must throw a `DataSourceError` on failure. They must never
 * resolve to an empty or partial result to paper over a failure - the UI has
 * to be able to tell "nothing published" apart from "the request failed".
 */
export interface DataSource {
  readonly mode: DataMode
  getCreator(slug: string): Promise<Creator>
  getCatalog(slug: string): Promise<ContentSummary[]>
  getContent(slug: string, contentSlug: string): Promise<ContentDetail>
}
