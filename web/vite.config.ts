import { fileURLToPath } from 'node:url'
import { loadEnv, type ProxyOptions } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const studioPath = /^\/api\/creators\/[a-zA-Z0-9_-]+\/studio\/draft-previews(?:\/[a-zA-Z0-9_-]+)?$/

// The browser never receives the operator capability. Forward only the two
// studio operations from a browser on this loopback development server.
function studioProxy(mode: string): Record<string, ProxyOptions> {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const env = loadEnv(mode, root, ['API_PORT', 'DRAFT_PREVIEW_TOKEN'])
  const token = env.DRAFT_PREVIEW_TOKEN
  if (!token || token.length < 32) return {}

  return {
    '^/api/creators/[^/]+/studio/': {
      target: `http://127.0.0.1:${Number(env.API_PORT || 8000)}`,
      changeOrigin: true,
      bypass(req) {
        const host = req.headers.host
        const isLoopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '')
        const localHost = host === `127.0.0.1:${req.socket.localPort}` || host === `localhost:${req.socket.localPort}`
        const ownOrigin = req.headers.origin === `http://${host}`
        const ownRead = req.method === 'GET' && !req.headers.origin && req.headers['sec-fetch-site'] === 'same-origin'
        if (!isLoopback || !localHost || !(ownOrigin || ownRead) ||
            !['GET', 'PUT'].includes(req.method ?? '') || !studioPath.test(req.url ?? '') ||
            req.headers['x-studio-request'] !== 'draft-preview') return false
      },
      configure(proxy) {
        proxy.on('proxyReq', (request) => request.setHeader('authorization', `Bearer ${token}`))
      },
    },
  }
}

export default defineConfig(({ mode, command, isPreview }) => ({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: command === 'serve' && !isPreview && mode !== 'test' ? studioProxy(mode) : {},
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    // The integration suite serves its API-mode build on an isolated loopback port.
    proxy: isPreview && mode === 'studio-e2e' ? studioProxy(mode) : {},
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
}))
