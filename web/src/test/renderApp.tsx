import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { AppRoutes } from '../App'
import { CreatorProvider } from '../state/creator'
import { DemoSessionProvider } from '../state/demoSession'

/** Mount the full application at a given route. */
export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DemoSessionProvider>
        <CreatorProvider>
          <AppRoutes />
        </CreatorProvider>
      </DemoSessionProvider>
    </MemoryRouter>,
  )
}
