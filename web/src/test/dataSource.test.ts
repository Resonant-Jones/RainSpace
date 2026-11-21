import { afterEach, describe, expect, it, vi } from 'vitest'

import { DataSourceError } from '../data/errors'
import { createApiDataSource } from '../data/apiSource'
import { createFixturesDataSource } from '../data/fixturesSource'

describe('fixtures data source', () => {
  it('serves the demo creator and its published catalogue', async () => {
    const source = createFixturesDataSource()

    expect(source.mode).toBe('fixtures')
    expect((await source.getCreator('demo')).display_name).toBe('Demo Creator')

    const catalogue = await source.getCatalog('demo')
    expect(catalogue.length).toBeGreaterThan(0)
    expect(catalogue.every((item) => item.published_at !== null)).toBe(true)
  })

  it('rejects an unknown creator instead of returning empty data', async () => {
    const source = createFixturesDataSource()

    await expect(source.getCreator('nobody')).rejects.toBeInstanceOf(
      DataSourceError,
    )
  })

  it('rejects unpublished content', async () => {
    const source = createFixturesDataSource()

    await expect(source.getContent('demo', 'untitled-workshop-draft')).rejects.toBeInstanceOf(
      DataSourceError,
    )
  })
})

describe('api data source', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the catalogue when the API responds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [{ slug: 'one' }, { slug: 'two' }],
      })),
    )

    const source = createApiDataSource('http://api.test')
    const catalogue = await source.getCatalog('demo')

    expect(source.mode).toBe('api')
    expect(catalogue).toHaveLength(2)
  })

  it('raises an error for a server failure rather than an empty catalogue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })),
    )

    const source = createApiDataSource('http://api.test')

    await expect(source.getCatalog('demo')).rejects.toBeInstanceOf(DataSourceError)
  })

  it('raises an error when the API cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network unreachable')
      }),
    )

    const source = createApiDataSource('http://api.test')

    await expect(source.getCatalog('demo')).rejects.toBeInstanceOf(DataSourceError)
  })
})
