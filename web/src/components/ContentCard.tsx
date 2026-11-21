import { Link } from 'react-router-dom'

import type { ContentSummary } from '../data'
import { formatDuration, formatPrice } from '../lib/format'
import { Artwork } from './Artwork'

function previewDuration(item: ContentSummary): number | null {
  const preview = item.media.find((asset) => asset.asset_type === 'preview')
  return preview?.duration_seconds ?? null
}

export function ContentCard({ item }: { item: ContentSummary }) {
  const preview = previewDuration(item)

  return (
    <article className="card">
      <Link className="card-link" to={`/videos/${item.slug}`}>
        <Artwork seed={item.slug} label={item.title} />
        <div className="card-body">
          <h3 className="card-title">{item.title}</h3>
          {item.description ? (
            <p className="card-description">{item.description}</p>
          ) : null}
          <div className="card-meta">
            <span className="price">
              {formatPrice(item.price_minor_units, item.currency)}
            </span>
            <span className="muted">
              {preview === null
                ? 'Preview unavailable'
                : `Preview ${formatDuration(preview)}`}
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}
