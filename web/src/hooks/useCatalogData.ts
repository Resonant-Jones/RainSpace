import { useEffect, useState } from 'react'

import { DataSourceError, dataSource, type ContentSummary } from '../data'

interface CatalogState {
  key: string
  items: ContentSummary[]
  error: string | null
}

/**
 * Load a creator's published catalogue.
 *
 * A failure is reported as an error. It is never collapsed into an empty
 * catalogue, so "the API is down" can never look like "nothing published".
 *
 * The result is stored against the slug it was requested for, so loading and
 * error state are derived during render rather than reset inside the effect.
 */
export function useCatalogData(slug: string) {
  const [state, setState] = useState<CatalogState | null>(null)

  useEffect(() => {
    let cancelled = false

    dataSource
      .getCatalog(slug)
      .then((items) => {
        if (cancelled) return
        setState({ key: slug, items, error: null })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setState({
          key: slug,
          items: [],
          error:
            cause instanceof DataSourceError
              ? cause.message
              : 'The catalogue could not be loaded.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const current = state?.key === slug ? state : null

  return {
    items: current?.items ?? [],
    loading: current === null,
    error: current?.error ?? null,
  }
}
