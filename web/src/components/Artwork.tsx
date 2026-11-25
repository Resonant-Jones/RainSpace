import { useCreator } from '../state/creatorContext'
import { editionArt } from '../data/editionArt'

export function Artwork({ seed, label }: { seed: string; label?: string }) {
  const { slug } = useCreator()
  const plate = editionArt(slug, seed)
  return (
    <div className="artwork" role="img" aria-label={plate?.label ?? `Cover unavailable for ${label ?? 'this release'}`}>
      {plate && <span className="artwork-plate" style={{ backgroundPositionY: plate.position, backgroundImage: `url("${plate.image}")` }} />}
    </div>
  )
}
