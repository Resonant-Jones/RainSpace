import { dataSource } from '../data'

/**
 * The persistent demonstration indicator.
 *
 * It is rendered on every route and states plainly which behaviours are
 * simulated and where the page data came from. Removing it would break the
 * rule that a simulated feature must never look like a real one.
 */
export function DemoBanner() {
  const modeLabel =
    dataSource.mode === 'api'
      ? 'Data: live API'
      : 'Data: bundled demo fixtures'

  return (
    <div className="demo-banner" role="status" data-testid="demo-banner">
      <strong>Demo mode</strong>
      <span>
        Accounts, purchases, messages and creator-console processing states are
        simulated. No real payments, accounts or media exist.
      </span>
      <span className="demo-banner-mode">{modeLabel}</span>
    </div>
  )
}
