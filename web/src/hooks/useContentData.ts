import { useEffect, useState } from 'react'

import { DataSourceError, dataSource, type ContentDetail } from '../data'

interface ContentState {
  key: string
  item: ContentDetail | null
  error: string | null
}

/**
 * Load a single published content item.
 *
 * A missing or unpublished item is an error, not an empty result.
 */
export function useContentData(creatorSlug: string, contentSlug: string) {
  const [state, setState] = useState<ContentState | null>(null)
  const key = `${creatorSlug}/${contentSlug}`

  useEffect(() => {
    let cancelled = false

    dataSource
      .getContent(creatorSlug, contentSlug)
      .then((item) => {
        if (cancelled) return
        setState({ key, item, error: null })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setState({
          key,
          item: null,
          error:
            cause instanceof DataSourceError
              ? cause.message
              : 'This content could not be loaded.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [creatorSlug, contentSlug, key])

  const current = state?.key === key ? state : null

  return {
    item: current?.item ?? null,
    loading: current === null,
    error: current?.error ?? null,
  }
}
