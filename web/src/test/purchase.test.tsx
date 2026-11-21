import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { renderApp } from './renderApp'

describe('simulated purchase flow', () => {
  it('signs in, simulates a purchase and shows the item in the library', async () => {
    renderApp('/login')

    fireEvent.change(await screen.findByLabelText('Display name'), {
      target: { value: 'Demo Fan' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continue as demo fan/i }))

    // The demo sign-in lands on the library.
    expect(
      await screen.findByRole('heading', { name: 'Library', level: 1 }),
    ).toBeInTheDocument()

    // Walk to a paid item through the primary navigation.
    fireEvent.click(screen.getByRole('link', { name: 'Videos' }))
    expect(
      await screen.findByRole('heading', { name: 'Catalogue', level: 1 }),
    ).toBeInTheDocument()

    fireEvent.click(
      await screen.findByRole('link', { name: /Night Bus: A Short Film/ }),
    )
    expect(
      await screen.findByRole('heading', {
        name: 'Night Bus: A Short Film',
        level: 1,
      }),
    ).toBeInTheDocument()

    // The purchase is explicitly labelled as simulated and asks for no card.
    const purchaseButton = await screen.findByRole('button', {
      name: /simulate purchase/i,
    })
    expect(purchaseButton).toHaveTextContent(/no payment is taken/i)
    expect(
      screen.queryByLabelText(/card number/i) ??
        screen.queryByLabelText(/password/i),
    ).toBeNull()

    fireEvent.click(purchaseButton)
    fireEvent.click(
      await screen.findByRole('button', { name: /confirm simulated purchase/i }),
    )

    expect(await screen.findByText(/in your library \(simulated\)/i)).toBeInTheDocument()

    // And the item is now listed in the library.
    fireEvent.click(screen.getByRole('link', { name: 'Library' }))
    expect(
      await screen.findByRole('heading', { name: 'Library', level: 1 }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('link', { name: /Night Bus: A Short Film/ }),
    ).toBeInTheDocument()
  })

  it('never asks for a password on the sign-in page', async () => {
    renderApp('/login')

    expect(await screen.findByLabelText('Display name')).toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).toBeNull()
    expect(screen.getByText(/no password field on purpose/i)).toBeInTheDocument()
  })
})
