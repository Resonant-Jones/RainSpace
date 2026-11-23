import { dataSource } from '../data'

export function DemoBanner() {
  return (
    <details className="demo-banner" data-testid="demo-banner">
      <summary>Demo mode</summary>
      <div className="demo-info">
        <strong>About this storefront</strong>
        <p>Sign-in, checkout, messages and creator operations are simulated. No real payments, accounts or media entitlements are created.</p>
        <p>Rainspace Editions is a fictional studio. Its cover stills were generated for this demo. The public film teaser and its listening study use an original synthesized soundtrack.</p>
        <small>{dataSource.mode === 'api' ? 'Catalogue source · Live API' : 'Catalogue source · Bundled demo fixtures'}</small>
      </div>
    </details>
  )
}
