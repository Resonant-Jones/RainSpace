import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  DemoSessionContext,
  type DemoSessionContextValue,
  type DemoSessionState,
} from './demoSessionContext'

const STORAGE_KEY = 'cdp.demo.session.v1'

const EMPTY_SESSION: DemoSessionState = {
  loggedIn: false,
  displayName: null,
  purchases: [],
}

function readSession(): DemoSessionState {
  if (typeof window === 'undefined') return EMPTY_SESSION
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_SESSION
    const parsed = JSON.parse(raw) as Partial<DemoSessionState>
    return {
      loggedIn: Boolean(parsed.loggedIn),
      displayName:
        typeof parsed.displayName === 'string' ? parsed.displayName : null,
      purchases: Array.isArray(parsed.purchases)
        ? parsed.purchases.filter((slug): slug is string => typeof slug === 'string')
        : [],
    }
  } catch {
    return EMPTY_SESSION
  }
}

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSessionState>(readSession)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      // A browser that refuses storage still gets a working demo session.
    }
  }, [session])

  const login = useCallback((displayName: string) => {
    setSession((current) => ({
      ...current,
      loggedIn: true,
      displayName: displayName.trim() || 'Demo Fan',
    }))
  }, [])

  const logout = useCallback(() => {
    setSession({ ...EMPTY_SESSION })
  }, [])

  const purchase = useCallback((slug: string) => {
    setSession((current) =>
      current.purchases.includes(slug)
        ? current
        : { ...current, purchases: [...current.purchases, slug] },
    )
  }, [])

  const hasPurchased = useCallback(
    (slug: string) => session.purchases.includes(slug),
    [session.purchases],
  )

  const value = useMemo<DemoSessionContextValue>(
    () => ({ ...session, login, logout, purchase, hasPurchased }),
    [session, login, logout, purchase, hasPurchased],
  )

  return (
    <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>
  )
}
