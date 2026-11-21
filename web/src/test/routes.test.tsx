import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'

import { renderApp } from './renderApp'

const ROUTES: Array<{ path: string; heading: string }> = [
  { path: '/', heading: 'Demo Creator' },
  { path: '/videos', heading: 'Catalogue' },
  { path: '/videos/night-bus-short-film', heading: 'Night Bus: A Short Film' },
  { path: '/blog', heading: 'Updates' },
  { path: '/messages', heading: 'Messages' },
  { path: '/login', heading: 'Sign in (demonstration)' },
  { path: '/library', heading: 'Library' },
  { path: '/admin', heading: 'Overview' },
  { path: '/admin/content', heading: 'Content' },
  { path: '/admin/schedule', heading: 'Schedule' },
]

describe('required routes', () => {
  for (const route of ROUTES) {
    it(`renders ${route.path}`, async () => {
      renderApp(route.path)
      expect(
        await screen.findByRole('heading', { name: route.heading, level: 1 }),
      ).toBeInTheDocument()
    })
  }

  it('renders a not-found page for an unknown route', async () => {
    renderApp('/does-not-exist')
    expect(
      await screen.findByRole('heading', { name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
