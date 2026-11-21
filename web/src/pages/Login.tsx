import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { Notice } from '../components/Notice'
import { useDemoSession } from '../state/demoSessionContext'

export function Login() {
  const session = useDemoSession()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    session.login(displayName)
    navigate('/library')
  }

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <h1>Sign in (demonstration)</h1>
        <p className="lede">
          Choose a display name to explore the fan side of the storefront.
        </p>
      </header>

      <Notice tone="warning" title="No real authentication">
        This form has no password field on purpose. There is no account, no
        credential and no session server — the chosen name is stored in this
        browser only, so the demonstration can show a signed-in state.
      </Notice>

      <form className="stack" onSubmit={handleSubmit}>
        <label htmlFor="display-name">Display name</label>
        <input
          id="display-name"
          name="display-name"
          type="text"
          value={displayName}
          placeholder="Demo Fan"
          autoComplete="off"
          onChange={(event) => setDisplayName(event.target.value)}
        />

        <button type="submit" className="button">
          Continue as demo fan
        </button>
      </form>

      {session.loggedIn ? (
        <p className="muted">
          Currently signed in as <strong>{session.displayName}</strong>.
        </p>
      ) : null}
    </div>
  )
}
