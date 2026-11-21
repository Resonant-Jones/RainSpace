import { useState } from 'react'

import { Notice } from '../components/Notice'
import { demoThreads } from '../data/fixtures'
import { useDemoSession } from '../state/demoSessionContext'

export function Messages() {
  const session = useDemoSession()
  const [activeId, setActiveId] = useState(demoThreads[0]?.id ?? '')
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<string[]>([])

  const active = demoThreads.find((thread) => thread.id === activeId)

  return (
    <div className="page">
      <header className="page-head">
        <h1>Messages</h1>
        <p className="lede">
          A fan messaging demonstration. Nothing is delivered to anyone — the
          conversation stays in this browser tab.
        </p>
      </header>

      <Notice tone="warning" title="Simulated inbox">
        There is no messaging backend in this build. Threads are sample data
        and replies are stored in local component state only.
      </Notice>

      <div className="thread-layout">
        <aside className="thread-list">
          <h2>Threads</h2>
          {demoThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={
                thread.id === activeId ? 'thread is-active' : 'thread'
              }
              aria-pressed={thread.id === activeId}
              onClick={() => setActiveId(thread.id)}
            >
              <span className="thread-subject">{thread.subject}</span>
              <span className="muted">{thread.participant}</span>
            </button>
          ))}
        </aside>

        <section className="thread-panel">
          {active ? (
            <>
              <h2>{active.subject}</h2>
              <ul className="message-list">
                {active.messages.map((message, index) => (
                  <li key={`${message.sent_at}-${index}`} className="message">
                    <span className="message-author">
                      {message.from === 'creator' ? 'Creator' : active.participant}
                    </span>
                    <p>{message.body}</p>
                  </li>
                ))}
                {sent.map((message, index) => (
                  <li key={`sent-${index}`} className="message message-outgoing">
                    <span className="message-author">
                      {session.loggedIn ? session.displayName : 'Demo Fan'} (demo)
                    </span>
                    <p>{message}</p>
                  </li>
                ))}
              </ul>

              <form
                className="composer"
                onSubmit={(event) => {
                  event.preventDefault()
                  const body = draft.trim()
                  if (!body) return
                  setSent((current) => [...current, body])
                  setDraft('')
                }}
              >
                <label htmlFor="composer">Reply (simulated)</label>
                <textarea
                  id="composer"
                  value={draft}
                  rows={3}
                  placeholder="Write a reply. It will not be sent anywhere."
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="button button-small">
                  Send simulated reply
                </button>
              </form>
            </>
          ) : (
            <p className="muted">Select a thread to read it.</p>
          )}
        </section>
      </div>
    </div>
  )
}
