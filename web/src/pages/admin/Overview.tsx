import { Link } from 'react-router-dom'

import { Notice } from '../../components/Notice'
import { StatusChip } from '../../components/StatusChip'
import { consoleContent, sampleEarnings } from '../../data/fixtures'
import { formatPrice } from '../../lib/format'

const PROCESSING_LABELS: Record<string, string> = {
  queued: 'Queued for import',
  importing: 'Importing source media',
  transcoding: 'Transcoding preview',
  transcribing: 'Generating transcript',
  'awaiting-review': 'Awaiting creator review',
  ready: 'Ready to publish',
}

export function AdminOverview() {
  const counts = {
    total: consoleContent.length,
    published: consoleContent.filter((item) => item.status === 'published').length,
    scheduled: consoleContent.filter((item) => item.status === 'scheduled').length,
    draft: consoleContent.filter((item) => item.status === 'draft').length,
  }

  const processing = consoleContent.filter((item) => item.processing !== 'ready')
  const gross = sampleEarnings.reduce((sum, week) => sum + week.gross_minor_units, 0)

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Creator console</p>
        <h1>Overview</h1>
        <p className="lede">
          The shape of the console a creator would use to manage a catalogue.
        </p>
      </header>

      <Notice tone="warning" title="Demonstration data">
        Every number, status and processing state below is sample data held in
        the browser. The creator console has no backend in this build, and
        nothing here is persisted.
      </Notice>

      <section className="kpi-row" aria-label="Catalogue counts">
        <div className="kpi">
          <span className="kpi-value">{counts.total}</span>
          <span className="kpi-label">Total items</span>
        </div>
        <div className="kpi">
          <span className="kpi-value">{counts.published}</span>
          <span className="kpi-label">Published</span>
        </div>
        <div className="kpi">
          <span className="kpi-value">{counts.scheduled}</span>
          <span className="kpi-label">Scheduled</span>
        </div>
        <div className="kpi">
          <span className="kpi-value">{counts.draft}</span>
          <span className="kpi-label">Drafts</span>
        </div>
      </section>

      <div className="two-column">
        <section className="panel">
          <div className="panel-head">
            <h2>Processing status</h2>
            <StatusChip tone="demo" label="Sample states" />
          </div>
          <ul className="status-list">
            {processing.length === 0 ? (
              <li className="muted">Nothing is processing.</li>
            ) : (
              processing.map((item) => (
                <li key={item.slug}>
                  <span className="status-title">{item.title}</span>
                  <StatusChip tone="processing" label={PROCESSING_LABELS[item.processing]} />
                </li>
              ))
            )}
          </ul>
          <p className="muted">
            FFmpeg processing, transcription and metadata drafting are not
            implemented. These states illustrate where that work would surface.
          </p>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Earnings</h2>
            <StatusChip tone="demo" label="Sample data" />
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Period</th>
                <th scope="col">Gross</th>
                <th scope="col">Purchases</th>
                <th scope="col">Refunds</th>
              </tr>
            </thead>
            <tbody>
              {sampleEarnings.map((week) => (
                <tr key={week.period}>
                  <td>{week.period}</td>
                  <td>{formatPrice(week.gross_minor_units, week.currency)}</td>
                  <td>{week.purchases}</td>
                  <td>{week.refunds}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>Sample total</td>
                <td>{formatPrice(gross, 'USD')}</td>
                <td colSpan={2} className="muted">
                  Not real revenue
                </td>
              </tr>
            </tfoot>
          </table>
        </section>
      </div>

      <section className="panel">
        <h2>Next actions</h2>
        <div className="button-row">
          <Link to="/admin/content" className="button button-small">
            Manage content
          </Link>
          <Link to="/admin/schedule" className="button button-small button-ghost">
            Open the calendar
          </Link>
        </div>
      </section>
    </div>
  )
}
