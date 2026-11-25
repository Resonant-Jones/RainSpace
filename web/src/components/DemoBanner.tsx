import { dataSource } from '../data'
import { useCreator } from '../state/creatorContext'
import { studioArt } from '../data/editionArt'

export function DemoBanner() {
  const { slug } = useCreator()
  const live = dataSource.mode === 'api'
  return (
    <aside className="demo-banner" data-testid="demo-banner" aria-label="Demonstration status">
      <strong>Demo mode</strong>
      <span>Sign-in, checkout, messages and creator operations are simulated.{live && ' Local draft preview attachments are saved.'}</span>
      <small>{live ? 'Catalogue source · Live API' : 'Catalogue source · Bundled demo fixtures'}</small>
      <details>
        <summary>About the demo</summary>
        <p>No real payments, accounts or media entitlements are created. {studioArt.get(slug)?.provenance}</p>
      </details>
    </aside>
  )
}
