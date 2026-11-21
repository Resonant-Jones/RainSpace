import { hashString } from '../lib/format'

/**
 * Locally generated placeholder artwork.
 *
 * The storefront never loads a creator's real image or video file. The
 * gradient is derived from the content slug, so a card always looks the same
 * for the same item without shipping any asset.
 */
export function Artwork({ seed, label }: { seed: string; label?: string }) {
  const hash = hashString(seed)
  const hue = hash % 360
  const secondHue = (hue + 45) % 360
  const angle = (hash >> 9) % 360

  return (
    <div
      className="artwork"
      role="img"
      aria-label={label ? `${label} placeholder artwork` : 'Placeholder artwork'}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, hsl(${hue} 55% 30%), hsl(${secondHue} 45% 16%))`,
      }}
    >
      <span className="artwork-note" aria-hidden="true">
        placeholder artwork
      </span>
    </div>
  )
}
