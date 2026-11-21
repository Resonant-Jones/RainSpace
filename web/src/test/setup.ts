import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// Each test starts with an empty simulated session so a purchase in one test
// cannot leak into the next.
beforeEach(() => {
  window.localStorage.clear()
})

// Vitest runs with `globals: false`, so Testing Library does not register its
// automatic cleanup. Without this, rendered trees accumulate across tests in
// the same file and queries start matching stale elements.
afterEach(() => {
  cleanup()
})
