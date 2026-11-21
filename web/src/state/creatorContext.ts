import { createContext, useContext } from 'react'

import type { Creator } from '../data'

export interface CreatorContextValue {
  creator: Creator | null
  loading: boolean
  error: string | null
  /** Slug of the creator whose storefront is being rendered. */
  slug: string
}

export const CreatorContext = createContext<CreatorContextValue | null>(null)

export function useCreator(): CreatorContextValue {
  const context = useContext(CreatorContext)
  if (!context) {
    throw new Error('useCreator must be used inside a CreatorProvider.')
  }
  return context
}
