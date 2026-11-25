import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Notice } from '../../components/Notice'

interface Draft {
  slug: string
  title: string
  preview_id: string | null
}
interface Preview {
  id: string
  title: string
}
interface Inventory {
  drafts: Draft[]
  previews: Preview[]
}

const headers = { 'X-Studio-Request': 'draft-preview' }

function DraftPlayer({ endpoint, title }: { endpoint: string; title: string }) {
  const [source, setSource] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    let url = ''
    async function load() {
      try {
        const response = await fetch(endpoint, { headers, cache: 'no-store', signal: controller.signal })
        if (!response.ok) throw new Error('Preview unavailable')
        const blob = await response.blob()
        if (!controller.signal.aborted) {
          url = URL.createObjectURL(blob)
          setSource(url)
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true)
      }
    }
    void load()
    return () => {
      controller.abort()
      if (url) URL.revokeObjectURL(url)
    }
  }, [endpoint])
  if (failed) return <p role="alert">The saved sample could not be played.</p>
  return source && <video src={source} controls preload="metadata" playsInline aria-label={title}
    onError={() => setFailed(true)} style={{ width: '100%', maxWidth: '36rem' }} />
}

function AttachmentForm({ draft, previews, endpoint, onSaved, onReload }: {
  draft: Draft
  previews: Preview[]
  endpoint: string
  onSaved: (draft: Draft) => void
  onReload: () => void
}) {
  const [choice, setChoice] = useState(draft.preview_id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const unchanged = (choice || null) === draft.preview_id
  const action = !choice && draft.preview_id ? 'Remove preview' : 'Attach preview'
  const saved = previews.find(preview => preview.id === draft.preview_id)

  async function save(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await fetch(`${endpoint}/${encodeURIComponent(draft.slug)}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview_id: choice || null, expected_preview_id: draft.preview_id }),
      })
      if (!result.ok) {
        setError(result.status === 409 ? 'Another edit changed this attachment. Reload to see it.' :
          'The save could not be confirmed. Reload to check the draft.')
        return
      }
      const updated: Draft = await result.json()
      onSaved(updated)
    } catch {
      setError('The save could not be confirmed. Reload to check the draft.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <form className="stack" onSubmit={save}>
        <label htmlFor="approved-preview">Approved public preview</label>
        <select id="approved-preview" value={choice} onChange={e => setChoice(e.target.value)} disabled={busy}>
          <option value="">No preview</option>
          {draft.preview_id && !saved && <option value={draft.preview_id} disabled>Previously attached preview is unavailable</option>}
          {previews.map(preview => <option key={preview.id} value={preview.id}>{preview.title}</option>)}
        </select>
        <div className="button-row">
          <button className="button" type="submit" disabled={busy || unchanged}>
            {busy ? 'Saving…' : saved && unchanged ? 'Preview attached' : action}
          </button>
        </div>
      </form>
      {error && <Notice tone="error" title="Check attachment">
        {error} <button className="link-button" type="button" onClick={onReload}>Reload draft</button>
      </Notice>}
      <p role="status">
        {saved ? `Attached preview · ${saved.title}` : draft.preview_id ? 'The attached preview is no longer approved.' : 'No preview attached.'}
      </p>
      {saved && <DraftPlayer endpoint={`${endpoint}/${encodeURIComponent(draft.slug)}`} title={saved.title} />}
    </>
  )
}

export function DraftPreviews({ creatorSlug }: { creatorSlug: string }) {
  const endpoint = `/api/creators/${encodeURIComponent(creatorSlug)}/studio/draft-previews`
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const [params, setParams] = useSearchParams()
  const draft = inventory?.drafts.find(item => item.slug === params.get('draft')) ?? inventory?.drafts[0]

  function reload() {
    setInventory(null)
    setFailed(false)
    setRevision(current => current + 1)
  }

  useEffect(() => {
    const abort = new AbortController()
    async function load() {
      try {
        const result = await fetch(endpoint, { headers, cache: 'no-store', signal: abort.signal })
        if (!result.ok) throw new Error('Unavailable')
        const data: Inventory = await result.json()
        if (!abort.signal.aborted) setInventory(data)
      } catch {
        if (!abort.signal.aborted) setFailed(true)
      }
    }
    void load()
    return () => abort.abort()
  }, [endpoint, revision])

  function updateDraft(updated: Draft) {
    setInventory(current => current && ({
      ...current, drafts: current.drafts.map(item => item.slug === updated.slug ? updated : item),
    }))
  }

  return (
    <section id="draft-previews" className="panel" aria-labelledby="draft-preview-title">
      <h2 id="draft-preview-title">Draft release preview</h2>
      <p className="muted">Save an approved public sample with a draft. The release stays unpublished.</p>
      {failed && <Notice tone="error" title="Local editor unavailable">
        Check the local studio connection. <button className="link-button" type="button" onClick={reload}>Retry</button>
      </Notice>}
      {!failed && !inventory && <p role="status">Loading drafts…</p>}
      {inventory && !draft && <p>No draft releases are available.</p>}
      {inventory && draft && (
        <>
          <div className="stack">
            <label htmlFor="draft-release">Draft release</label>
            <select id="draft-release" value={draft.slug} onChange={event => {
              const next = new URLSearchParams(params)
              next.set('draft', event.target.value)
              setParams(next, { replace: true })
            }}>
              {inventory.drafts.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}
            </select>
          </div>
          <AttachmentForm key={JSON.stringify([draft.slug, draft.preview_id])}
            draft={draft} previews={inventory.previews} endpoint={endpoint} onSaved={updateDraft} onReload={reload} />
        </>
      )}
    </section>
  )
}
