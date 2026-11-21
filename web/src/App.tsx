import { Route, Routes } from 'react-router-dom'

import { Layout } from './components/Layout'
import { AdminContent } from './pages/admin/ContentAdmin'
import { AdminOverview } from './pages/admin/Overview'
import { AdminSchedule } from './pages/admin/Schedule'
import { Blog } from './pages/Blog'
import { Catalog } from './pages/Catalog'
import { ContentDetail } from './pages/ContentDetail'
import { Landing } from './pages/Landing'
import { Library } from './pages/Library'
import { Login } from './pages/Login'
import { Messages } from './pages/Messages'
import { NotFound } from './pages/NotFound'

/**
 * Route table for the storefront and the creator console.
 *
 * `AppRoutes` is exported separately from the router shell so tests can mount
 * the routes inside a MemoryRouter.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="videos" element={<Catalog />} />
        <Route path="videos/:slug" element={<ContentDetail />} />
        <Route path="blog" element={<Blog />} />
        <Route path="messages" element={<Messages />} />
        <Route path="login" element={<Login />} />
        <Route path="library" element={<Library />} />
        <Route path="admin" element={<AdminOverview />} />
        <Route path="admin/content" element={<AdminContent />} />
        <Route path="admin/schedule" element={<AdminSchedule />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
