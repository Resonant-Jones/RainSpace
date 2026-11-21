import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'

import { renderApp } from './renderApp'

describe('storefront shell', () => {
  it('renders the demo banner on every route', async () => {
    renderApp('/')
    const banner = await screen.findByTestId('demo-banner')
    expect(banner).toBeInTheDocument()
    expect(banner).toHaveTextContent(/demo mode/i)
  })

  it('states that accounts and purchases are simulated', async () => {
    renderApp('/')
    const banner = await screen.findByTestId('demo-banner')
    expect(banner).toHaveTextContent(/simulated/i)
    expect(banner).toHaveTextContent(/no real payments, accounts or media/i)
  })

  it('shows the creator name from the data source', async () => {
    renderApp('/')
    expect(
      await screen.findByRole('heading', { name: 'Demo Creator', level: 1 }),
    ).toBeInTheDocument()
  })

  it('labels the active data mode', async () => {
    renderApp('/')
    expect(await screen.findByText(/bundled demo fixtures/i)).toBeInTheDocument()
  })

  it('renders the primary navigation', async () => {
    renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Primary' })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Videos' })).toHaveAttribute(
      'href',
      '/videos',
    )
    expect(screen.getByRole('link', { name: 'Creator' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })
})
