export type ChipTone = 'draft' | 'scheduled' | 'published' | 'processing' | 'demo'

const LABELS: Record<ChipTone, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  processing: 'Processing',
  demo: 'Simulated',
}

export function StatusChip({
  tone,
  label,
}: {
  tone: ChipTone
  label?: string
}) {
  return (
    <span className={`chip chip-${tone}`} data-testid={`chip-${tone}`}>
      {label ?? LABELS[tone]}
    </span>
  )
}
