import { DataSourceError } from './errors'
import { demoCreator, publishedContent } from './fixtures'
import type { ContentDetail, ContentSummary, Creator, DataSource } from './types'

/**
 * Fixture-backed data source.
 *
 * This is the default mode: the storefront is fully demonstrable with no
 * backend running, which is what the Netlify deployment ships.
 */
export function createFixturesDataSource(): DataSource {
  const assertCreator = (slug: string): void => {
    if (slug !== demoCreator.slug) {
      throw new DataSourceError(`No fixture creator with slug "${slug}".`, 404)
    }
  }

  return {
    mode: 'fixtures',

    async getCreator(slug: string): Promise<Creator> {
      assertCreator(slug)
      return demoCreator
    },

    async getCatalog(slug: string): Promise<ContentSummary[]> {
      assertCreator(slug)
      return publishedContent
    },

    async getContent(slug: string, contentSlug: string): Promise<ContentDetail> {
      assertCreator(slug)
      const item = publishedContent.find((entry) => entry.slug === contentSlug)
      if (!item) {
        throw new DataSourceError(
          `No published fixture content with slug "${contentSlug}".`,
          404,
        )
      }
      return item
    },
  }
}
