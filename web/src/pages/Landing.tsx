import { Link } from 'react-router-dom'

import { Artwork } from '../components/Artwork'
import { ContentCard } from '../components/ContentCard'
import { Notice } from '../components/Notice'
import { useCatalogData } from '../hooks/useCatalogData'
import { useCreator } from '../state/creatorContext'

export function Landing() {
  const { creator, loading, error, slug } = useCreator()
  const { items, loading: catalogLoading, error: catalogError } = useCatalogData(slug)
  const latest = [...items].sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? '')).slice(0, 3)
  const feature = latest[0]
  const [title, subtitle] = feature?.title.split(/: (.+)/) ?? []
  return (
    <div className="page landing">
      {error && <Notice tone="error" title="Storefront unavailable">The studio profile could not be loaded. Please try again shortly.</Notice>}
      {catalogError && <Notice tone="error" title="Catalogue unavailable">Releases could not be loaded. Please try again shortly.</Notice>}
      {(loading || catalogLoading) && <p role="status">Loading the storefront…</p>}
      {feature && (
        <section className="feature" aria-labelledby="feature-title">
          <Artwork seed={feature.slug} label={feature.title} />
          <div className="feature-copy">
            <p className="eyebrow">Featured release</p>
            <h2 id="feature-title">{title}</h2>
            {subtitle && <p className="feature-subtitle">{subtitle}</p>}
            <p className="feature-description">{feature.description}</p>
            <div className="hero-actions">
              <Link to={`/videos/${feature.slug}`} className="button">Explore release <span aria-hidden="true">↗</span></Link>
              <Link to="/videos" className="hero-link">Browse the catalogue <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
      )}
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Studio releases</h2>
            {creator?.tagline && <p className="lede">{creator.tagline}</p>}
          </div>
          <Link to="/videos" className="link">All releases <span aria-hidden="true">→</span></Link>
        </div>
        {!catalogLoading && !catalogError && !items.length && <p className="muted">The first release will appear here when it is published.</p>}
        <div className="grid">
          {latest.map((item) => <ContentCard key={item.slug} item={item} />)}
        </div>
      </section>
    </div>
  )
}
