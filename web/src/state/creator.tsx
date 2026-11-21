import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { CREATOR_SLUG } from '../config/env'
import { DataSourceError, dataSource, type Creator } from '../data'
import { CreatorContext, type CreatorContextValue } from './creatorContext'

const THEME_VARIABLES = [
  ['--color-primary', 'primary'],
  ['--color-accent', 'accent'],
  ['--color-bg', 'background'],
  ['--color-surface', 'surface'],
  ['--color-text', 'text'],
  ['--color-muted', 'muted'],
] as const

interface CreatorState {
  key: string
  creator: Creator | null
  error: string | null
}

export function CreatorProvider({
  children,
  slug = CREATOR_SLUG,
}: {
  children: ReactNode
  slug?: string
}) {
  const [state, setState] = useState<CreatorState | null>(null)

  useEffect(() => {
    let cancelled = false

    dataSource
      .getCreator(slug)
      .then((creator) => {
        if (cancelled) return
        setState({ key: slug, creator, error: null })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setState({
          key: slug,
          creator: null,
          error:
            cause instanceof DataSourceError
              ? cause.message
              : 'The storefront could not be loaded.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  const current = state?.key === slug ? state : null
  const creator = current?.creator ?? null

  // The theme is data, not code: a creator's colours are applied as CSS
  // custom properties so no component hard-codes branding.
  useEffect(() => {
    if (!creator) return
    const root = document.documentElement
    for (const [variable, key] of THEME_VARIABLES) {
      root.style.setProperty(variable, creator.theme[key])
    }
  }, [creator])

  const value = useMemo<CreatorContextValue>(
    () => ({
      creator,
      loading: current === null,
      error: current?.error ?? null,
      slug,
    }),
    [creator, current, slug],
  )

  return <CreatorContext.Provider value={value}>{children}</CreatorContext.Provider>
}
