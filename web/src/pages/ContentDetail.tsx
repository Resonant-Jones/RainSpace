import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Artwork } from '../components/Artwork'
import { Notice } from '../components/Notice'
import { StatusChip } from '../components/StatusChip'
import { API_BASE_URL, DATA_MODE } from '../config/env'
import { editionArt } from '../data/editionArt'
import type { ContentSummary } from '../data'
import { useContentData } from '../hooks/useContentData'
import { formatDate, formatDuration, formatPrice } from '../lib/format'
import { useCreator } from '../state/creatorContext'
import { useDemoSession } from '../state/demoSessionContext'

function ReleasePreview({ item, creatorSlug }: { item: ContentSummary; creatorSlug: string }) {
  const [state, setState] = useState<'poster' | 'playing' | 'failed'>('poster')
  const audioOnly = editionArt(creatorSlug, item.slug)?.audio
  const preview = item.media.find((asset) => asset.asset_type === 'preview' && asset.mime_type === 'video/mp4')
  const [resolved, setResolved] = useState<{ path: string | null; failed: boolean } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const route = `/api/creators/${encodeURIComponent(creatorSlug)}/catalog/${encodeURIComponent(item.slug)}/preview`
  const endpoint = `${API_BASE_URL.replace(/\/$/, '')}${route}`

  useEffect(() => {
    if (!preview || DATA_MODE !== 'api') return
    const controller = new AbortController()
    async function resolvePreview() {
      try {
        const result = await fetch(endpoint, { signal: controller.signal, cache: 'no-store' })
        if (!result.ok && result.status !== 404) throw new Error('Preview lookup failed')
        const path: unknown = result.ok ? (await result.json()).path : null
        if (path !== null && path !== `${route}/bytes`) {
          throw new Error('Unsupported public preview')
        }
        if (!controller.signal.aborted) setResolved({ path: path ? `${endpoint}/bytes` : null, failed: false })
      } catch {
        if (!controller.signal.aborted) setResolved({ path: null, failed: true })
      }
    }
    void resolvePreview()
    return () => controller.abort()
  }, [route, endpoint, preview, attempt])

  const source = resolved?.path
  const available = preview && source
  const playing = available && state === 'playing'
  return (
    <div className="release-preview">
      {playing && !audioOnly ? (
        <video controls autoPlay playsInline src={source} aria-label={`${item.title} public teaser`} onError={() => setState('failed')} />
      ) : <Artwork seed={item.slug} label={item.title} />}
      {playing && audioOnly &&
        <audio controls autoPlay src={source} aria-label={`${item.title} sound bed`} onError={() => setState('failed')} />}
      {available && state === 'poster' &&
        <button className="play-preview" type="button" onClick={() => setState('playing')}>
          <span aria-hidden="true">▶</span> {audioOnly ? 'Listen to the study' : 'Play teaser'} · {formatDuration(preview.duration_seconds)}
        </button>}
      {available && state === 'failed' && (
        <div className="preview-message" role="alert">
          The preview could not be played. <button className="link-button" type="button" onClick={() => setState('playing')}>Try again</button>
        </div>
      )}
      {!available && (preview && DATA_MODE === 'api' && !resolved
        ? <p className="preview-message" role="status">Loading preview…</p>
        : resolved?.failed
          ? <p className="preview-message" role="alert">The preview could not be loaded.{' '}
              <button className="link-button" onClick={() => setAttempt(current => current + 1)}>Retry</button>
            </p>
          : <p className="preview-message">{preview && DATA_MODE === 'fixtures'
              ? 'Playback for this sample is available in the API-backed demo.'
              : 'A public preview is unavailable for this release.'}</p>)}
    </div>
  )
}

export function ContentDetail() {
  const { slug: creatorSlug } = useCreator()
  const { slug: contentSlug = '' } = useParams()
  const session = useDemoSession()
  const { item, loading, error } = useContentData(creatorSlug, contentSlug)
  const [confirmingSlug, setConfirmingSlug] = useState<string | null>(null)

  if (loading) return <div className="page"><p role="status">Loading release…</p></div>
  if (error || !item) {
    return (
      <div className="page">
        <h1>Content unavailable</h1>
        <Notice tone="error" title="Release unavailable">This edition could not be loaded. Check the catalogue for current releases.</Notice>
        <Link to="/videos" className="link">Back to the catalogue →</Link>
      </div>
    )
  }

  const isFree = item.price_minor_units === 0
  const price = formatPrice(item.price_minor_units, item.currency)
  const addToLibrary = () => {
    session.purchase(item.slug)
    setConfirmingSlug(null)
  }
  return (
    <div className="page release-page">
      <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/videos">← Catalogue</Link></nav>
      <header className="release-heading">
        <h1>{item.title}</h1>
        <p className="release-date">Released {formatDate(item.published_at)}</p>
      </header>
      <div className="detail-layout">
        <div className="detail-main">
          <ReleasePreview key={`${creatorSlug}/${item.slug}`} item={item} creatorSlug={creatorSlug} />
          {item.description?.split('\n\n').map((paragraph, index) => (
            <p key={index} className={index === 0 ? 'lede' : undefined}>{paragraph}</p>
          ))}
        </div>
        <aside className="detail-side" aria-label="Library access">
          <p className="eyebrow">Library access</p>
          <strong className="price price-large">{price}</strong>
          {session.hasPurchased(item.slug) ? (
            <>
              <StatusChip tone="demo" label="In your library (simulated)" />
              <p className="muted">Saved to this browser’s demo library. Only the public samples are playable.</p>
              <Link to="/library" className="button">Open the library</Link>
            </>
          ) : !session.loggedIn ? (
            <>
              <p>Choose a display name to try the demo library. This sign-in stays in your browser.</p>
              <form className="stack" onSubmit={(event) => {
                event.preventDefault()
                const name = new FormData(event.currentTarget).get('displayName')
                session.login(typeof name === 'string' ? name : '')
              }}>
                <label htmlFor="release-display-name">Display name</label>
                <input id="release-display-name" name="displayName" placeholder="Demo Fan" autoComplete="off" />
                <button type="submit" className="button">Sign in (demo)</button>
              </form>
              <p className="muted">Checkout is simulated. No money changes hands.</p>
            </>
          ) : confirmingSlug === contentSlug ? (
            <div className="confirm-panel">
              <strong>Confirm demo purchase · {price}</strong>
              <p>This adds the release to this browser’s library. No payment is taken or private media unlocked.</p>
              <div className="button-row">
                <button type="button" className="button" onClick={addToLibrary}>
                  Confirm simulated purchase
                </button>
                <button type="button" className="button button-ghost" onClick={() => setConfirmingSlug(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="muted">Save this release to your local demonstration library. Access is simulated.</p>
              <button
                type="button"
                className="button"
                onClick={isFree ? addToLibrary : () => setConfirmingSlug(contentSlug)}
              >
                {isFree ? 'Add to library (demo)' : 'Simulate purchase — no payment is taken'}
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
