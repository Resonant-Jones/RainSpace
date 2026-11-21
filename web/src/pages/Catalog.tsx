import { useMemo, useState } from 'react'

import { ContentCard } from '../components/ContentCard'
import { Notice } from '../components/Notice'
import { useCatalogData } from '../hooks/useCatalogData'
import { useCreator } from '../state/creatorContext'

type PriceFilter = 'all' | 'free' | 'paid'
type SortKey = 'newest' | 'title' | 'price'

const PRICE_FILTERS: Array<{ value: PriceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'price', label: 'Price low–high' },
]

export function Catalog() {
  const { slug } = useCreator()
  const { items, loading, error } = useCatalogData(slug)

  const [query, setQuery] = useState('')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const filtered = items.filter((item) => {
      const matchesQuery =
        needle === '' ||
        item.title.toLowerCase().includes(needle) ||
        (item.description ?? '').toLowerCase().includes(needle)
      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'free'
          ? item.price_minor_units === 0
          : item.price_minor_units > 0)
      return matchesQuery && matchesPrice
    })

    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title)
      if (sortKey === 'price') {
        return (
          a.price_minor_units - b.price_minor_units ||
          a.title.localeCompare(b.title)
        )
      }
      const aDate = a.published_at ? Date.parse(a.published_at) : 0
      const bDate = b.published_at ? Date.parse(b.published_at) : 0
      return bDate - aDate || a.title.localeCompare(b.title)
    })
    return sorted
  }, [items, query, priceFilter, sortKey])

  return (
    <div className="page">
      <header className="page-head">
        <h1>Catalogue</h1>
        <p className="lede">
          Published content for this creator. Only published items are ever
          listed here.
        </p>
      </header>

      <section className="toolbar" aria-label="Catalogue filters">
        <div className="toolbar-field">
          <label htmlFor="catalog-search">Search</label>
          <input
            id="catalog-search"
            type="search"
            value={query}
            placeholder="Search titles and descriptions"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="toolbar-field">
          <span className="toolbar-label" id="price-filter-label">
            Price
          </span>
          <div
            className="tab-row"
            role="group"
            aria-labelledby="price-filter-label"
          >
            {PRICE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  priceFilter === filter.value
                    ? 'tab is-active'
                    : 'tab'
                }
                aria-pressed={priceFilter === filter.value}
                onClick={() => setPriceFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-field">
          <label htmlFor="catalog-sort">Sort</label>
          <select
            id="catalog-sort"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <p className="muted result-count" aria-live="polite">
        Showing {visible.length} of {items.length} published{' '}
        {items.length === 1 ? 'item' : 'items'}
      </p>

      {loading ? <p className="muted">Loading the catalogue…</p> : null}

      {error ? (
        <Notice tone="error" title="Catalogue unavailable">
          {error}
        </Notice>
      ) : null}

      {!loading && !error && visible.length === 0 ? (
        <Notice tone="info" title="Nothing matches those filters">
          Adjust the search text or the price filter to see published content.
        </Notice>
      ) : null}

      <div className="grid">
        {visible.map((item) => (
          <ContentCard key={item.slug} item={item} />
        ))}
      </div>
    </div>
  )
}
