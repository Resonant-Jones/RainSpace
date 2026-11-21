import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ContentCard } from '../components/ContentCard'
import { Notice } from '../components/Notice'
import { DataSourceError, dataSource, type ContentDetail } from '../data'
import { useCreator } from '../state/creatorContext'
import { useDemoSession } from '../state/demoSessionContext'

interface UnavailableEntry {
  slug: string
  message: string
}

interface LibraryState {
  key: string
  items: ContentDetail[]
  unavailable: UnavailableEntry[]
  error: string | null
}

export function Library() {
  const { slug: creatorSlug } = useCreator()
  const session = useDemoSession()

  const purchases = session.purchases
  const signature = purchases.join('|')
  const [state, setState] = useState<LibraryState | null>(null)

  useEffect(() => {
    if (purchases.length === 0) return

    let cancelled = false
    const key = purchases.join('|')

    Promise.all(
      purchases.map(async (contentSlug) => {
        try {
          const item = await dataSource.getContent(creatorSlug, contentSlug)
          return { item, failure: null }
        } catch (cause: unknown) {
          return {
            item: null,
            failure: {
              slug: contentSlug,
              message:
                cause instanceof DataSourceError
                  ? cause.message
                  : 'This item could not be loaded.',
            },
          }
        }
      }),
    )
      .then((results) => {
        if (cancelled) return
        setState({
          key,
          items: results
            .map((result) => result.item)
            .filter((item): item is ContentDetail => item !== null),
          unavailable: results
            .map((result) => result.failure)
            .filter((failure): failure is UnavailableEntry => failure !== null),
          error: null,
        })
      })
      .catch(() => {
        if (cancelled) return
        setState({
          key,
          items: [],
          unavailable: [],
          error: 'The library could not be loaded.',
        })
      })

    return () => {
      cancelled = true
    }
  }, [creatorSlug, purchases])

  const current = state?.key === signature ? state : null
  const items = current?.items ?? []
  const unavailable = current?.unavailable ?? []
  const error = current?.error ?? null
  const loading = purchases.length > 0 && current === null

  return (
    <div className="page">
      <header className="page-head">
        <h1>Library</h1>
        <p className="lede">
          Purchased content, as it would appear to a fan. In this build the
          library is a local demonstration list, not a real entitlement.
        </p>
      </header>

      {!session.loggedIn ? (
        <Notice tone="info" title="Not signed in">
          <Link to="/login">Sign in (demo)</Link> to see how the signed-in
          experience looks. No password is required.
        </Notice>
      ) : null}

      {error ? (
        <Notice tone="error" title="Library unavailable">
          {error}
        </Notice>
      ) : null}

      {loading ? <p className="muted">Loading your library…</p> : null}

      {!loading && session.loggedIn && purchases.length === 0 ? (
        <Notice tone="info" title="Nothing here yet">
          <Link to="/videos">Browse the catalogue</Link> and use a simulated
          purchase to see an item appear here.
        </Notice>
      ) : null}

      {unavailable.map((entry) => (
        <Notice key={entry.slug} tone="warning" title="Item unavailable">
          {entry.message}
        </Notice>
      ))}

      <div className="grid">
        {items.map((item) => (
          <ContentCard key={item.slug} item={item} />
        ))}
      </div>
    </div>
  )
}
