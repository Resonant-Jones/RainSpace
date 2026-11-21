import { useMemo, useState, type ChangeEvent } from 'react'

import { Notice } from '../../components/Notice'
import { StatusChip, type ChipTone } from '../../components/StatusChip'
import { consoleContent, type ConsoleContentItem, type ConsoleStatus } from '../../data/fixtures'
import { formatPrice } from '../../lib/format'

const STEPS = ['Import', 'Process', 'Review', 'Schedule', 'Publish'] as const

const STATUS_TABS: Array<{ value: ConsoleStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
]

function statusTone(status: ConsoleStatus): ChipTone {
  if (status === 'published') return 'published'
  if (status === 'scheduled') return 'scheduled'
  return 'draft'
}

export function AdminContent() {
  const [statusFilter, setStatusFilter] = useState<ConsoleStatus | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    consoleContent[0]?.slug ?? null,
  )
  const [step, setStep] = useState(0)
  const [stagedFile, setStagedFile] = useState<string | null>(null)
  const [savedNote, setSavedNote] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return consoleContent.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesQuery =
        needle === '' || item.title.toLowerCase().includes(needle)
      return matchesStatus && matchesQuery
    })
  }, [statusFilter, query])

  const selected: ConsoleContentItem | null =
    consoleContent.find((item) => item.slug === selectedSlug) ?? null

  function selectItem(item: ConsoleContentItem) {
    setSelectedSlug(item.slug)
    setDraftTitle(item.title)
    setDraftDescription(item.description ?? '')
    setStep(item.status === 'published' ? STEPS.length - 1 : 0)
    setSavedNote(null)
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setStagedFile(file ? file.name : null)
    setSavedNote(null)
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Creator console</p>
        <h1>Content</h1>
        <p className="lede">
          The inventory a creator would manage: drafts, scheduled items and
          published work.
        </p>
      </header>

      <Notice tone="warning" title="Demonstration only">
        This view is driven by bundled sample rows. Edits, uploads and status
        changes below are local to this browser session and are not persisted.
      </Notice>

      <section className="toolbar" aria-label="Content filters">
        <div className="toolbar-field">
          <label htmlFor="content-search">Search</label>
          <input
            id="content-search"
            type="search"
            value={query}
            placeholder="Search titles"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="toolbar-field">
          <span className="toolbar-label" id="status-filter-label">
            Status
          </span>
          <div className="tab-row" role="group" aria-labelledby="status-filter-label">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={statusFilter === tab.value ? 'tab is-active' : 'tab'}
                aria-pressed={statusFilter === tab.value}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="admin-layout">
        <section className="panel">
          <div className="panel-head">
            <h2>Inventory</h2>
            <span className="muted">{visible.length} items</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr
                  key={item.slug}
                  className={item.slug === selectedSlug ? 'is-selected' : undefined}
                  onClick={() => selectItem(item)}
                >
                  <td>
                    <button
                      type="button"
                      className="row-button"
                      onClick={() => selectItem(item)}
                    >
                      {item.title}
                    </button>
                  </td>
                  <td>
                    <StatusChip tone={statusTone(item.status)} />
                  </td>
                  <td>{formatPrice(item.price_minor_units, item.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {visible.length === 0 ? (
            <p className="muted">No items match that filter.</p>
          ) : null}
        </section>

        <section className="panel">
          <h2>Item detail</h2>

          {selected ? (
            <>
              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSavedNote(
                    'Saved to this browser session only. Nothing was written to a server.',
                  )
                }}
              >
                <label htmlFor="item-title">Title</label>
                <input
                  id="item-title"
                  type="text"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                />

                <label htmlFor="item-description">Description</label>
                <textarea
                  id="item-description"
                  rows={3}
                  value={draftDescription}
                  onChange={(event) => setDraftDescription(event.target.value)}
                />

                <button type="submit" className="button button-small">
                  Save changes (demo)
                </button>
              </form>

              {savedNote ? (
                <Notice tone="info" title="Demonstration">
                  {savedNote}
                </Notice>
              ) : null}

              <div className="editorial-flow">
                <h3>Editorial flow</h3>
                <ol className="stepper">
                  {STEPS.map((label, index) => (
                    <li
                      key={label}
                      className={
                        index === step
                          ? 'step is-current'
                          : index < step
                            ? 'step is-done'
                            : 'step'
                      }
                    >
                      <span className="step-index">{index + 1}</span>
                      <span className="step-label">{label}</span>
                    </li>
                  ))}
                </ol>
                <div className="button-row">
                  <button
                    type="button"
                    className="button button-small"
                    disabled={step >= STEPS.length - 1}
                    onClick={() => setStep((current) => Math.min(current + 1, STEPS.length - 1))}
                  >
                    Advance to {STEPS[Math.min(step + 1, STEPS.length - 1)]} (demonstration)
                  </button>
                  <button
                    type="button"
                    className="button button-small button-ghost"
                    disabled={step <= 0}
                    onClick={() => setStep((current) => Math.max(current - 1, 0))}
                  >
                    Step back
                  </button>
                </div>
                <p className="muted">
                  Advancing the step is a demonstration of the intended flow. No
                  job runs and no status changes in the database.
                </p>
              </div>

              <div className="upload-block">
                <h3>Upload</h3>
                <label htmlFor="upload-input">Choose a source file</label>
                <input
                  id="upload-input"
                  type="file"
                  accept="video/*"
                  onChange={handleUpload}
                />
                {stagedFile ? (
                  <Notice tone="info" title="Demo upload staged">
                    <strong>{stagedFile}</strong> was staged in the browser. Media
                    ingestion is not implemented in this build, so nothing was
                    uploaded, transcoded or stored.
                  </Notice>
                ) : (
                  <p className="muted">
                    Import, FFmpeg processing and transcription are not
                    implemented yet.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="muted">Select an item to edit it.</p>
          )}
        </section>
      </div>
    </div>
  )
}
