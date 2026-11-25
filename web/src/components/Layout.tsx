import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { useCreator } from '../state/creatorContext'
import { useDemoSession } from '../state/demoSessionContext'
import { DemoBanner } from './DemoBanner'

const NAV_ITEMS = [
  { to: '/', label: 'Home', end: true },
  { to: '/videos', label: 'Videos' },
  { to: '/blog', label: 'Blog' },
  { to: '/messages', label: 'Messages' },
  { to: '/library', label: 'Library' },
  { to: '/admin', label: 'Creator' },
]

function Navigation() {
  const session = useDemoSession()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="store-navigation" onClick={() => setOpen(!open)}>
        {open ? 'Close' : 'Menu'} <span aria-hidden="true">{open ? '×' : '☰'}</span>
      </button>
      <div id="store-navigation" className={open ? 'navigation is-open' : 'navigation'}>
        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'site-nav-link is-active' : 'site-nav-link'} onClick={() => setOpen(false)}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="session-area">
          {session.loggedIn ? (
            <>
              <span className="user-name">Demo · {session.displayName}</span>
              <button type="button" className="button button-small button-ghost" onClick={session.logout}>Sign out</button>
            </>
          ) : <NavLink to="/login" className="button button-small button-ghost">Sign in (demo)</NavLink>}
        </div>
      </div>
    </>
  )
}

export function Layout() {
  const { creator, loading } = useCreator()
  const { pathname } = useLocation()
  const BrandName = pathname === '/' ? 'h1' : 'span'
  const name = creator?.display_name ?? (loading ? 'Loading studio…' : 'Storefront')
  useEffect(() => {
    document.title = `${name} · Film & Sound`
  }, [name])
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <Link to="/" className="brand-link">
              <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
              <BrandName className="brand-name">{name}</BrandName>
            </Link>
          </div>
          <Navigation key={pathname} />
        </div>
        <DemoBanner key={pathname} />
      </header>
      <main className="site-main"><Outlet /></main>
      <footer className="site-footer">
        <strong>{name}</strong>
        <span>Demonstration storefront</span>
        <Link to="/admin">Creator console <span aria-hidden="true">↗</span></Link>
      </footer>
    </div>
  )
}
