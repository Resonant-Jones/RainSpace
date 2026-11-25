/// <reference lib="dom" />
import { expect, test } from '@playwright/test'
import { startLocalStack } from './localStack'

test('approved sample survives refresh, plays after publication, and stops after withdrawal or removal', async ({ page, request, browser }) => {
  test.setTimeout(180_000)
  const stack = await startLocalStack()
  const { origin, api, fixture } = stack
  const catalogue = '/api/creators/demo/catalog'
  const slug = 'untitled-workshop-draft'
  const release = catalogue + '/' + slug
  const preview = release + '/preview'
  const studio = '/api/creators/demo/studio/draft-previews'
  const optIn = { 'X-Studio-Request': 'draft-preview', Origin: origin }
  async function status(label: string, result: { status(): number }, expected: number) {
    console.log(label, result.status())
    expect(result.status()).toBe(expected)
  }
  try {
    await page.goto(origin + '/admin/content')
    await expect(page.getByText('Catalogue source · Live API')).toBeInViewport()
    const choice = page.getByLabel('Approved public preview')
    await choice.selectOption('night-bus-teaser')
    await page.getByRole('button', { name: 'Attach preview' }).click()
    await expect(page.getByText(/Attached preview · Night Bus/)).toBeVisible()
    await page.reload()
    await expect(choice).toHaveValue('night-bus-teaser')
    const sql = fixture('read')
    console.log('PostgreSQL after refresh', sql)
    expect(sql).toBe('draft|night-bus-teaser')
    const other = await browser.newPage()
    try {
      await other.goto(origin + '/admin/content')
      await expect(other.getByLabel('Approved public preview')).toHaveValue('night-bus-teaser')
    } finally { await other.close() }
    await expect.poll(() => page.locator('#draft-previews video').evaluate((v: HTMLVideoElement) => v.readyState)).toBeGreaterThan(0)
    expect((await (await request.get(api + catalogue)).json()).map((row: {slug: string}) => row.slug)).not.toContain(slug)
    for (const path of [release, preview, preview + '/bytes']) await status('Draft ' + path, await request.get(api + path), 404)
    await status('API without bearer', await request.get(api + studio), 404)
    await status('Non-studio JSON path through studio proxy', await request.get(origin + catalogue, {
      headers: { ...optIn, Accept: 'application/json' },
    }), 404)
    await status('No opt-in header', await request.get(origin + studio, { headers: { Origin: origin } }), 404)
    await status('Other origin', await request.get(origin + studio, { headers: { ...optIn, Origin: 'http://localhost:1' } }), 404)
    await status('Non-allowlisted studio path', await request.get(origin + studio + '/extra/path', { headers: optIn }), 404)
    await status('Unexpected method', await request.post(origin + studio, { headers: optIn }), 404)
    const put = (url: string, id: string | null, previous: string | null) =>
      request.put(origin + url, { headers: optIn, data: { preview_id: id, expected_preview_id: previous } })
    const edit = studio + '/' + slug
    for (const invalid of ['unknown', '/private/original.mp4', 'https://example.invalid/media']) {
      await status('Rejected selection ' + invalid, await put(edit, invalid, null), 422)
    }
    await status('Stale removal', await put(edit, null, null), 409)
    await status('Wrong creator', await put(edit.replace('/demo/', '/other/'), null, null), 404)
    fixture('published')
    await status('Published target write', await put(edit, null, 'night-bus-teaser'), 404)
    const metadata = await request.get(api + preview)
    await status('Published preview metadata', metadata, 200)
    expect((await metadata.json()).path).toBe(preview + '/bytes')
    await page.goto(origin + '/videos/' + slug)
    await page.getByRole('button', { name: /Play teaser/ }).click()
    await expect.poll(() => page.locator('video').evaluate((v: HTMLVideoElement) => v.currentTime)).toBeGreaterThan(0)
    const media = await request.get(api + preview + '/bytes', { headers: { Range: 'bytes=0-15' } })
    await status('Playable media range', media, 206)
    expect(media.headers()['content-type']).toBe('video/mp4')
    expect((await media.body()).toString('ascii')).toContain('ftyp')
    fixture('withdraw')
    for (const path of [preview, preview + '/bytes']) await status('Withdrawn ' + path, await request.get(api + path), 404)
    fixture('restore')
    fixture('draft')
    await page.goto(origin + '/admin/content')
    await choice.selectOption('')
    await page.getByRole('button', { name: 'Remove preview' }).click()
    await expect(page.getByText('No preview attached.')).toBeVisible()
    expect(fixture('read')).toBe('draft|none')
    fixture('published')
    for (const path of [preview, preview + '/bytes']) await status('Detached ' + path, await request.get(api + path), 404)
  } finally { await stack.close() }
})
