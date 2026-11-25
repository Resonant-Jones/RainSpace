import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { DraftPreviews } from '../pages/admin/DraftPreviews'

const draft = { slug: 'cut', title: 'Working cut', preview_id: null }
const preview = { id: 'sample', title: 'Reviewed sample' }
const response = (value: unknown, status = 200) => Response.json(value, { status })

function inventory() {
  const fetcher = vi.fn<typeof fetch>()
  fetcher.mockResolvedValueOnce(response({ drafts: [draft], previews: [preview] }))
  vi.stubGlobal('fetch', fetcher)
  render(<MemoryRouter><DraftPreviews creatorSlug="owner" /></MemoryRouter>)
  return fetcher
}

async function choose() {
  fireEvent.change(await screen.findByLabelText('Approved public preview'), { target: { value: 'sample' } })
  fireEvent.click(screen.getByRole('button', { name: 'Attach preview' }))
}

afterEach(() => vi.unstubAllGlobals())

it('shows loading until the inventory arrives', () => {
  const fetcher = vi.fn(() => new Promise<Response>(() => {}))
  vi.stubGlobal('fetch', fetcher)
  render(<MemoryRouter><DraftPreviews creatorSlug="owner" /></MemoryRouter>)
  expect(screen.getByText('Loading drafts…')).toBeVisible()
})

it('shows saving and confirms the attachment only after the server saves', async () => {
  const fetcher = inventory()
  let finish!: (result: Response) => void
  fetcher.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
  fetcher.mockResolvedValueOnce(response({}, 404))
  await choose()
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  expect(fetcher.mock.calls[1][1]?.body).toBe(JSON.stringify({ preview_id: 'sample', expected_preview_id: null }))
  finish(response({ ...draft, preview_id: 'sample' }))
  expect(await screen.findByText('Attached preview · Reviewed sample')).toBeVisible()
  expect(await screen.findByText('The saved sample could not be played.')).toBeVisible()
})

it.each([[409, 'Another edit changed this attachment.'], [404, 'The save could not be confirmed.']])(
  'explains HTTP %s and allows a fresh read', async (status, message) => {
    const fetcher = inventory()
    fetcher.mockResolvedValueOnce(response({}, Number(status)))
    await choose()
    expect(await screen.findByText(String(message), { exact: false })).toBeVisible()
    fetcher.mockResolvedValueOnce(response({ drafts: [], previews: [] }))
    fireEvent.click(screen.getByText('Reload draft'))
    expect(await screen.findByText('No draft releases are available.')).toBeVisible()
  },
)

it('reports an unavailable studio on inventory refusal', async () => {
  const fetcher = vi.fn().mockResolvedValue(response({}, 404))
  vi.stubGlobal('fetch', fetcher)
  render(<MemoryRouter><DraftPreviews creatorSlug="owner" /></MemoryRouter>)
  expect(await screen.findByText('Local editor unavailable')).toBeVisible()
})
