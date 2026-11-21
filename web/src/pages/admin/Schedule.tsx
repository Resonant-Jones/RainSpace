import { useMemo, useState } from 'react'

import { Notice } from '../../components/Notice'
import { StatusChip } from '../../components/StatusChip'
import { consoleContent } from '../../data/fixtures'
import { formatDate } from '../../lib/format'

const WEEK_START = new Date('2026-11-23T00:00:00') // Monday
const DAY_MS = 24 * 60 * 60 * 1000

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function AdminSchedule() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [moved, setMoved] = useState<Record<string, string>>({})

  const days = useMemo(() => {
    const start = new Date(WEEK_START.getTime() + weekOffset * 7 * DAY_MS)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start.getTime() + index * DAY_MS)
      return { date, key: toDateKey(date) }
    })
  }, [weekOffset])

  const weekLabel = `${formatDate(days[0].key)} – ${formatDate(days[6].key)}`

  const itemsByDate = useMemo(() => {
    const map = new Map<string, typeof consoleContent>()
    for (const item of consoleContent) {
      const key = moved[item.slug] ?? item.publish_on
      if (!key) continue
      const bucket = map.get(key) ?? []
      bucket.push(item)
      map.set(key, bucket)
    }
    return map
  }, [moved])

  return (
    <div className="page">
      <header className="page-head">
        <p className="eyebrow">Creator console</p>
        <h1>Schedule</h1>
        <p className="lede">
          A weekly publishing calendar for the creator. The scheduler itself is
          not implemented.
        </p>
      </header>

      <Notice tone="warning" title="Demonstration only">
        Calendar entries come from bundled sample rows and moving an item only
        changes this browser session. No publish job is scheduled.
      </Notice>

      <section className="toolbar" aria-label="Calendar navigation">
        <div className="toolbar-field">
          <button
            type="button"
            className="button button-small button-ghost"
            onClick={() => setWeekOffset((current) => current - 1)}
          >
            Previous week
          </button>
        </div>
        <div className="toolbar-field">
          <strong>{weekLabel}</strong>
        </div>
        <div className="toolbar-field">
          <button
            type="button"
            className="button button-small button-ghost"
            onClick={() => setWeekOffset((current) => current + 1)}
          >
            Next week
          </button>
        </div>
      </section>

      <div className="calendar" data-testid="calendar">
        {days.map((day) => {
          const items = itemsByDate.get(day.key) ?? []
          return (
            <section key={day.key} className="calendar-day">
              <header>
                <span className="calendar-weekday">
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="calendar-date">{day.date.getDate()}</span>
              </header>
              {items.length === 0 ? (
                <p className="muted calendar-empty">Empty</p>
              ) : (
                <ul className="calendar-items">
                  {items.map((item) => (
                    <li key={item.slug} className="calendar-item">
                      <span className="calendar-item-title">{item.title}</span>
                      <StatusChip
                        tone={item.status === 'published' ? 'published' : 'scheduled'}
                      />
                      {item.status === 'scheduled' ? (
                        <button
                          type="button"
                          className="button button-small button-ghost"
                          onClick={() => {
                            const current = moved[item.slug] ?? item.publish_on
                            if (!current) return
                            const next = new Date(
                              new Date(`${current}T00:00:00`).getTime() + DAY_MS,
                            )
                            setMoved((state) => ({
                              ...state,
                              [item.slug]: toDateKey(next),
                            }))
                          }}
                        >
                          Move a day (demo)
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
