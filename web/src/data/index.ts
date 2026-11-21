import { API_BASE_URL, DATA_MODE } from '../config/env'
import { createApiDataSource } from './apiSource'
import { createFixturesDataSource } from './fixturesSource'
import type { DataSource } from './types'

/**
 * The application's single data entry point.
 *
 * `fixtures` mode (the default, and what the Netlify site ships) reads the
 * bundled sample data. `api` mode reads the live FastAPI service. Both
 * satisfy the same contract, so no component needs to know which one is
 * active - only `dataSource.mode` is used, to label the UI.
 */
export const dataSource: DataSource =
  DATA_MODE === 'api' ? createApiDataSource(API_BASE_URL) : createFixturesDataSource()

export { DATA_MODE }
export { DataSourceError } from './errors'
export type {
  ContentDetail,
  ContentSummary,
  Creator,
  DataMode,
  DataSource,
  PublicMedia,
  Theme,
} from './types'
