import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Artwork } from '../components/Artwork'
import { Notice } from '../components/Notice'
import { StatusChip } from '../components/StatusChip'
import { useContentData } from '../hooks/useContentData'
import { formatDate, formatDuration, formatPrice } from '../lib/format'
import { useCreator } from '../state/creatorContext'
import { useDemoSession } from '../state/demoSessionContext'

export function ContentDetail() {
  const { slug: creatorSlug } = useCreator()
  const { slug: contentSlug = '' } = useParams()
  const session = useDemoSession()

  const { item, loading, error } = useContentData(creatorSlug, contentSlug)

  // The confirmation panel belongs to the slug it was opened for, so it
  // resets itself when the visitor moves to another item.
  const [confirmingSlug, setConfirmingSlug] = useState<string | null>(null)
  const confirming = confirmingSlug === contentSlug

  const owned = item ? session.hasPurchased(item.slug) : false
  const isFree = item ? item.price_minor_units === 0 : false

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading content…</p>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="page">
        <header className="page-head">
          <h1>Content unavailable</h1>
        </header>
        <Notice tone="error" title="Not found">
          {error ?? 'This content is not published.'}
        </Notice>
        <Link to="/videos" className="button">
          Back to the catalogue
        </Link>
      </div>
    )
  }

  const preview = item.media.find((asset) => asset.asset_type === 'preview')

  return (
    <div className="page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/videos">Catalogue</Link>
        <span aria-hidden="true">/</span>
        <span>{item.title}</span>
      </nav>

      <div className="detail-layout">
        <div className="detail-main">
          <Artwork seed={item.slug} label={item.title} />
          <h1>{item.title}</h1>
          {item.description ? (
            <p className="lede">{item.description}</p>
          ) : null}

          <dl className="detail-facts">
            <div>
              <dt>Published</dt>
              <dd>{formatDate(item.published_at)}</dd>
            </div>
            <div>
              <dt>Preview</dt>
              <dd>
                {preview ? formatDuration(preview.duration_seconds) : 'Not available'}
              </dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>
                {isFree ? 'Free preview' : 'Paid preview — simulated purchase'}
              </dd>
            </div>
          </dl>

          <Notice tone="info" title="Where the media lives">
            Original media is stored privately behind a signed access path. This
            storefront only ever renders locally generated placeholder artwork,
            so no paid or original file is served from this site.
          </Notice>
        </div>

        <aside className="detail-side">
          <div className="price-block">
            <span className="price price-large">
              {formatPrice(item.price_minor_units, item.currency)}
            </span>
            {item.price_minor_units > 0 ? (
              <span className="muted">Minor units: {item.price_minor_units}</span>
            ) : null}
          </div>

          {owned ? (
            <>
              <StatusChip tone="demo" label="In your library (simulated)" />
              <p className="muted">
                This is a demonstration entry. No payment was taken and no
                entitlement exists.
              </p>
              <Link to="/library" className="button">
                Open the library
              </Link>
            </>
          ) : !session.loggedIn ? (
            <>
              <Notice tone="info" title="Sign in to continue">
                The demonstration sign-in asks for a display name only. No
                password, card details or personal information is collected.
              </Notice>
              <Link to="/login" className="button">
                Sign in (demo)
              </Link>
            </>
          ) : confirming ? (
            <div className="confirm-panel">
              <p>
                Confirm a <strong>simulated</strong> purchase of{' '}
                <strong>
                  {formatPrice(item.price_minor_units, item.currency)}
                </strong>
                .
              </p>
              <p className="muted">
                No payment provider is contacted and no card details are
                requested. The item is added to a local demonstration library.
              </p>
              <div className="button-row">
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    session.purchase(item.slug)
                    setConfirmingSlug(null)
                  }}
                >
                  Confirm simulated purchase
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setConfirmingSlug(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="muted">
                {isFree
                  ? 'Free preview — add it to the demonstration library.'
                  : 'Paid preview — the purchase step below is simulated.'}
              </p>
              <button
                type="button"
                className="button"
                onClick={() => setConfirmingSlug(contentSlug)}
              >
                {isFree
                  ? 'Add to library (demo)'
                  : 'Simulate purchase — no payment is taken'}
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
