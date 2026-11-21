import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AppRoutes } from './App'
import { CreatorProvider } from './state/creator'
import { DemoSessionProvider } from './state/demoSession'
import './styles.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root was not found in index.html.')
}

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <DemoSessionProvider>
        <CreatorProvider>
          <AppRoutes />
        </CreatorProvider>
      </DemoSessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
