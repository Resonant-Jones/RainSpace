import type { ReactNode } from 'react'

export function Notice({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warning' | 'error'
  title?: string
  children: ReactNode
}) {
  return (
    <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'note'}>
      {title ? <strong className="notice-title">{title}</strong> : null}
      <div className="notice-body">{children}</div>
    </div>
  )
}
