/**
 * Failure type for the data boundary.
 *
 * A failed read must surface as an error, never as a successful empty
 * response. `status` carries the HTTP status when the failure came from the
 * API, and is `null` for transport failures.
 */
export class DataSourceError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = 'DataSourceError'
    this.status = status
  }
}
