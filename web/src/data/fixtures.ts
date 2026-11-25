import type { ContentSummary, Creator } from './types'

/** Offline catalogue for the generic demo creator. The catalogue includes illustrative preview
 * metadata. Playable derivatives require a live approval check on the API.
 */
export const demoCreator: Creator = {
  slug: 'demo',
  display_name: 'Demo Creator',
  tagline: 'Independent films, sound studies and lessons from the scoring room.',
  theme: {
    primary: '#20221f',
    accent: '#efab79',
    background: '#111310',
    surface: '#1b1d1a',
    text: '#f5f1e7',
    muted: '#b6b7aa',
  },
  created_at: '2026-01-05T09:00:00Z',
}

const cover = () => ({
  asset_type: 'cover',
  mime_type: 'image/jpeg',
  duration_seconds: null,
})

const preview = () => ({
  asset_type: 'preview',
  mime_type: 'video/mp4',
  duration_seconds: 18,
})

export const publishedContent: ContentSummary[] = [
  {
    slug: 'field-recording-notes',
    title: 'Field Recording Notes',
    description:
      'Listen to the sound bed from Night Bus on its own. Follow the low motor tone beneath the rain, then listen for the two-note stop bell as the street falls quiet.',
    price_minor_units: 0,
    currency: 'USD',
    published_at: '2026-01-14T17:00:00Z',
    duration_seconds: 18,
    media: [cover(), preview()],
  },
  {
    slug: 'keyboard-mechanics',
    title: "Keyboard Mechanics: A Beginner's Path",
    description:
      'Build a cue for a night scene in three lessons. Start with a two-note motif, shape a soft attack, then leave space in the arrangement for the sound of the street.\n\nTry the opening exercise. Hold a low D for four beats. On the next bar, play A only on beat three. Repeat once with a slower attack and listen to how the same two notes move from the foreground into the room.',
    price_minor_units: 900,
    currency: 'USD',
    published_at: '2026-02-03T12:30:00Z',
    duration_seconds: null,
    media: [cover()],
  },
  {
    slug: 'night-bus-short-film',
    title: 'Night Bus: A Short Film',
    description:
      'The last bus waits under sodium lights. A study of rain on asphalt, the glow of an empty cabin and the small sounds that carry a city through the night.',
    price_minor_units: 1400,
    currency: 'USD',
    published_at: '2026-03-22T20:15:00Z',
    duration_seconds: 18,
    media: [cover(), preview()],
  },
]

// --- Creator console sample data -----------------------------------------
//
// The creator console has no backend in CDP-001. These rows stand in for the
// inventory view and are labelled as sample data in the UI.

export type ConsoleStatus = 'draft' | 'scheduled' | 'published'

export type ProcessingState =
  | 'queued'
  | 'importing'
  | 'transcoding'
  | 'transcribing'
  | 'awaiting-review'
  | 'ready'

export interface ConsoleContentItem {
  slug: string
  title: string
  description: string
  status: ConsoleStatus
  processing: ProcessingState
  price_minor_units: number
  currency: string
  publish_on: string | null
  views: number
}

export const consoleContent: ConsoleContentItem[] = [
  {
    slug: 'field-recording-notes',
    title: 'Field Recording Notes',
    description:
      'A short walk-and-talk session about capturing location sound.',
    status: 'published',
    processing: 'ready',
    price_minor_units: 0,
    currency: 'USD',
    publish_on: '2026-01-14',
    views: 1284,
  },
  {
    slug: 'keyboard-mechanics',
    title: "Keyboard Mechanics: A Beginner's Path",
    description:
      'An instructional series entry covering the fundamentals.',
    status: 'published',
    processing: 'ready',
    price_minor_units: 900,
    currency: 'USD',
    publish_on: '2026-02-03',
    views: 942,
  },
  {
    slug: 'night-bus-short-film',
    title: 'Night Bus: A Short Film',
    description:
      'A short film entry with a paid tier.',
    status: 'published',
    processing: 'ready',
    price_minor_units: 1400,
    currency: 'USD',
    publish_on: '2026-03-22',
    views: 2177,
  },
  {
    slug: 'room-tone-part-two',
    title: 'Room Tone: Part Two',
    description:
      'The second room tone entry, scheduled for release.',
    status: 'scheduled',
    processing: 'ready',
    price_minor_units: 0,
    currency: 'USD',
    publish_on: '2026-11-24',
    views: 0,
  },
  {
    slug: 'studio-light-setup',
    title: 'Studio Light Setup',
    description:
      'A walkthrough of the lighting setup used in the studio.',
    status: 'scheduled',
    processing: 'ready',
    price_minor_units: 700,
    currency: 'USD',
    publish_on: '2026-11-23',
    views: 0,
  },
  {
    slug: 'field-guide-editing',
    title: 'Field Guide to Editing',
    description:
      'A short field guide to everyday editing decisions.',
    status: 'scheduled',
    processing: 'awaiting-review',
    price_minor_units: 1100,
    currency: 'USD',
    publish_on: '2026-11-26',
    views: 0,
  },
  {
    slug: 'untitled-workshop-draft',
    title: 'Untitled Workshop Draft',
    description:
      'A draft workshop entry awaiting creator review.',
    status: 'draft',
    processing: 'awaiting-review',
    price_minor_units: 0,
    currency: 'USD',
    publish_on: null,
    views: 0,
  },
  {
    slug: 'microphone-placement-demo',
    title: 'Microphone Placement Demo',
    description:
      'A microphone placement demonstration, still processing.',
    status: 'draft',
    processing: 'transcribing',
    price_minor_units: 600,
    currency: 'USD',
    publish_on: null,
    views: 0,
  },
]

export interface BlogPost {
  slug: string
  title: string
  published_on: string
  excerpt: string
  body: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'why-this-platform-exists',
    title: 'Why this platform exists',
    published_on: '2026-01-08',
    excerpt:
      'One backend, many storefronts. A short note on the shape of the platform.',
    body: 'Platform placeholder post. It exists to demonstrate the blog route and the publishing surface, not to publish anything real.',
  },
  {
    slug: 'a-week-of-edits',
    title: 'A week of edits',
    published_on: '2026-02-11',
    excerpt: 'Workbench notes and what changed in the catalogue this week.',
    body: 'Placeholder post body. Scheduling and publishing are not implemented in the current foundation.',
  },
  {
    slug: 'studio-notes-q1',
    title: 'Studio notes, Q1',
    published_on: '2026-03-30',
    excerpt: 'Quarterly notes on the sample catalogue and the roadmap seam.',
    body: 'Placeholder post body. Every number shown in this demonstration is sample data.',
  },
]

export interface DemoThread {
  id: string
  participant: string
  subject: string
  messages: Array<{ from: 'fan' | 'creator'; body: string; sent_at: string }>
}

export const demoThreads: DemoThread[] = [
  {
    id: 'thread-1',
    participant: 'Demo Fan',
    subject: 'Question about the field recording entry',
    messages: [
      {
        from: 'fan',
        body: 'Is the room tone in this entry recorded on location?',
        sent_at: '2026-03-01T10:12:00Z',
      },
      {
        from: 'creator',
        body: 'Placeholder reply. Messaging is not connected to a real inbox.',
        sent_at: '2026-03-01T11:02:00Z',
      },
    ],
  },
  {
    id: 'thread-2',
    participant: 'Demo Fan',
    subject: 'Keyboard series — order',
    messages: [
      {
        from: 'fan',
        body: 'Does the beginners path include the later lessons?',
        sent_at: '2026-03-04T15:41:00Z',
      },
    ],
  },
]

export interface SampleEarnings {
  period: string
  gross_minor_units: number
  currency: string
  purchases: number
  refunds: number
}

export const sampleEarnings: SampleEarnings[] = [
  { period: 'Week 1', gross_minor_units: 0, currency: 'USD', purchases: 0, refunds: 0 },
  { period: 'Week 2', gross_minor_units: 2400, currency: 'USD', purchases: 2, refunds: 0 },
  { period: 'Week 3', gross_minor_units: 1800, currency: 'USD', purchases: 1, refunds: 1 },
  { period: 'Week 4', gross_minor_units: 4100, currency: 'USD', purchases: 3, refunds: 0 },
]
