import { NavLink, Outlet, Link } from 'react-router-dom'

import { useCreator } from '../state/creatorContext'
import { useDemoSession } from '../state/demoSessionContext'
import { DemoBanner } from './DemoBanner'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/videos', label: 'Videos' },
  { to: '/blog', label: 'Blog' },
  { to: '/messages', label: 'Messages' },
  { to: '/library', label: 'Library' },
  { to: '/admin', label: 'Creator', end: true },
]

export function Layout() {
  const { creator, loading } = useCreator()
  const session = useDemoSession()

  return (
    <div className="app-shell">
      <DemoBanner />

      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              ◆
            </span>
            <span className="brand-name">
              {loading ? 'Loading…' : (creator?.display_name ?? 'Storefront')}
            </span>
          </Link>

          <nav className="site-nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'site-nav-link is-active' : 'site-nav-link'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="session-area">
            {session.loggedIn ? (
              <>
                <span className="muted">
                  Signed in as <strong>{session.displayName}</strong> (demo)
                </span>
                <button
                  type="button"
                  className="button button-small button-ghost"
                  onClick={session.logout}
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink to="/login" className="button button-small">
                Sign in (demo)
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>
          Creator Distribution Platform — demonstration build. Content is
          placeholder data, accounts and purchases are simulated, and no media
          is served from this site.
        </p>
      </footer>
    </div>
  )
}
