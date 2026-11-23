import { useCreator } from '../state/creatorContext'

// Only public promotional stills are bundled. The contact sheet contains
// three original generated photographs, ordered film, keyboard, microphone.
const plates = new Map([
  ['night-bus-short-film', { position: 'top', label: 'A city bus idles on a rain-dark street' }],
  ['keyboard-mechanics', { position: 'center', label: 'Ivory synthesizer keys under a tungsten lamp' }],
  ['field-recording-notes', { position: 'bottom', label: 'A field microphone beside a misty river' }],
])

export function Artwork({ seed, label }: { seed: string; label?: string }) {
  const { slug } = useCreator()
  const plate = slug === 'demo' ? plates.get(seed) : undefined
  return (
    <div className="artwork" role="img" aria-label={plate?.label ?? `Cover unavailable for ${label ?? 'this release'}`}>
      {plate && <span className="artwork-plate" style={{ backgroundPositionY: plate.position }} />}
    </div>
  )
}
