import { createContext, useContext } from 'react'

/**
 * Simulated fan session contract.
 *
 * This is a demonstration aid, not an authentication system. It stores a
 * display name and a list of "purchased" slugs in localStorage. There is no
 * password, no token, no account and no payment - and it must never be
 * presented as a real entitlement.
 */

export interface DemoSessionState {
  loggedIn: boolean
  displayName: string | null
  /** Content slugs the visitor "purchased" in the demonstration. */
  purchases: string[]
}

export interface DemoSessionContextValue extends DemoSessionState {
  login: (displayName: string) => void
  logout: () => void
  purchase: (slug: string) => void
  hasPurchased: (slug: string) => boolean
}

export const DemoSessionContext = createContext<DemoSessionContextValue | null>(null)

export function useDemoSession(): DemoSessionContextValue {
  const context = useContext(DemoSessionContext)
  if (!context) {
    throw new Error('useDemoSession must be used inside a DemoSessionProvider.')
  }
  return context
}
