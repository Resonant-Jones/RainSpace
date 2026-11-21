import { DataSourceError } from './errors'
import type { ContentDetail, ContentSummary, Creator, DataSource } from './types'

/**
 * FastAPI-backed data source.
 *
 * A failed request always throws. It is never converted into an empty
 * catalogue, so the UI cannot present a transport or server failure as a
 * successful "nothing published" state.
 */
export function createApiDataSource(baseUrl: string): DataSource {
  const base = baseUrl.replace(/\/+$/, '')

  async function request<T>(path: string): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${base}${path}`, {
        headers: { Accept: 'application/json' },
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      throw new DataSourceError(
        `Could not reach the API at ${base}${path}: ${reason}`,
        null,
      )
    }

    if (!response.ok) {
      throw new DataSourceError(
        `API request failed with status ${response.status} for ${path}.`,
        response.status,
      )
    }

    return (await response.json()) as T
  }

  return {
    mode: 'api',

    getCreator(slug: string): Promise<Creator> {
      return request<Creator>(`/api/creators/${encodeURIComponent(slug)}`)
    },

    getCatalog(slug: string): Promise<ContentSummary[]> {
      return request<ContentSummary[]>(
        `/api/creators/${encodeURIComponent(slug)}/catalog`,
      )
    },

    getContent(slug: string, contentSlug: string): Promise<ContentDetail> {
      return request<ContentDetail>(
        `/api/creators/${encodeURIComponent(slug)}/catalog/${encodeURIComponent(contentSlug)}`,
      )
    },
  }
}
