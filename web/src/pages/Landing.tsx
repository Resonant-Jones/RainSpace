import { Link } from 'react-router-dom'

import { ContentCard } from '../components/ContentCard'
import { Notice } from '../components/Notice'
import { useCatalogData } from '../hooks/useCatalogData'
import { useCreator } from '../state/creatorContext'

export function Landing() {
  const { creator, loading, error, slug } = useCreator()
  const { items, loading: catalogLoading, error: catalogError } = useCatalogData(slug)

  const latest = items.slice(0, 3)

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Independent creator storefront</p>
          <h1>{creator?.display_name ?? 'Storefront'}</h1>
          <p className="lede">
            {creator?.tagline ??
              'A demonstration storefront for the creator distribution platform.'}
          </p>
          <div className="hero-actions">
            <Link to="/videos" className="button">
              Browse the catalogue
            </Link>
            <Link to="/admin" className="button button-ghost">
              Open the creator console
            </Link>
          </div>
        </div>
        <aside className="hero-panel">
          <h2>What you are looking at</h2>
          <ul className="check-list">
            <li>A public catalogue served by a creator-scoped API.</li>
            <li>A creator console showing the intended editorial flow.</li>
            <li>Simulated fan accounts, purchases, library and messaging.</li>
          </ul>
          <p className="muted">
            Nothing on this page is a real account, payment or media file.
          </p>
        </aside>
      </section>

      {error ? (
        <Notice tone="error" title="The storefront could not be loaded">
          {error}
        </Notice>
      ) : null}

      <section className="section">
        <div className="section-head">
          <h2>Latest releases</h2>
          <Link to="/videos" className="link">
            View the full catalogue
          </Link>
        </div>

        {catalogLoading ? <p className="muted">Loading the catalogue…</p> : null}
        {catalogError ? (
          <Notice tone="error" title="Catalogue unavailable">
            {catalogError}
          </Notice>
        ) : null}
        {!catalogLoading && !catalogError && latest.length === 0 ? (
          <p className="muted">No published content yet.</p>
        ) : null}

        <div className="grid">
          {latest.map((item) => (
            <ContentCard key={item.slug} item={item} />
          ))}
        </div>
      </section>

      <section className="section">
        <h2>How this platform is meant to grow</h2>
        <ol className="pipeline">
          <li>Batch import</li>
          <li>FFmpeg processing</li>
          <li>Transcription</li>
          <li>Metadata drafts</li>
          <li>Human review</li>
          <li>Publishing queue</li>
          <li>Creator storefront</li>
        </ol>
        <p className="muted">
          That pipeline is a product objective. Only the catalogue and the
          storefront exist today.
        </p>
      </section>

      {loading ? <p className="muted">Loading creator profile…</p> : null}
    </div>
  )
}
