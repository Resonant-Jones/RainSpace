// Optional, creator-scoped presentation data for reviewed promotional artwork.
interface Plate { position: string; label: string; audio?: boolean }

const pilot = {
  image: '/editions/contact-sheet.jpg',
  provenance: 'Rainspace Editions is a fictional studio. Its cover stills were generated for this demo, and its teaser uses an original synthesized soundtrack.',
  plates: new Map<string, Plate>([
    ['night-bus-short-film', { position: 'top', label: 'A city bus idles on a rain-dark street' }],
    ['keyboard-mechanics', { position: 'center', label: 'Ivory synthesizer keys under a tungsten lamp' }],
    ['field-recording-notes', { position: 'bottom', label: 'A field microphone beside a misty river', audio: true }],
  ]),
}

export const studioArt = new Map([['demo', pilot]])

export function editionArt(creator: string, release: string) {
  const studio = studioArt.get(creator)
  const plate = studio?.plates.get(release)
  return studio && plate ? { ...plate, image: studio.image } : undefined
}
