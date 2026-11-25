import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import { randomBytes, randomUUID } from 'node:crypto'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

async function availablePort() {
  const socket = createServer()
  await new Promise<void>(resolve => socket.listen(0, '127.0.0.1', resolve))
  const address = socket.address()
  if (!address || typeof address === 'string') throw new Error('No loopback port')
  await new Promise<void>((resolve, reject) => socket.close(error => error ? reject(error) : resolve()))
  return address.port
}

async function waitHttp(url: string) {
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return
    } catch { /* service is still starting */ }
    await delay(200)
  }
  throw new Error(`Local test service unavailable at ${url}`)
}

export async function startLocalStack() {
  const root = path.resolve('..')
  const tag = randomUUID().replaceAll('-', '')
  const schema = `cdp_browser_${tag}`
  const container = `cdp-browser-${tag}`
  const port = await availablePort()
  const origin = `http://127.0.0.1:${port}`
  const dir = mkdtempSync(path.join(tmpdir(), 'cdp-build-'))
  const env = {
    ...process.env, DRAFT_PREVIEW_TOKEN: randomBytes(32).toString('hex'),
    ALEMBIC_TARGET_SCHEMA: schema, PGOPTIONS: `-csearch_path=${schema},public`,
    CORS_ORIGINS: origin, DEMO_CREATOR_SLUG: 'demo', APP_ENV: 'development',
    OPENBLAS_NUM_THREADS: '1',
  }
  function docker(...args: string[]) {
    return execFileSync('docker', args, { cwd: root, env, encoding: 'utf8' }).trim()
  }
  const fixture = (action: string) => docker('compose', 'exec', '-T', '-e', 'ALEMBIC_TARGET_SCHEMA',
    '-e', 'OPENBLAS_NUM_THREADS', 'api', 'python', '-m', 'tests.browser_fixture', action)
  let server: ChildProcess | undefined
  let started = false
  let initialized = false
  async function close() {
    try {
      if (server && server.exitCode === null) {
        const stopped = new Promise(resolve => server!.once('exit', resolve))
        server.kill()
        await stopped
      }
      if (started) docker('stop', container)
    } finally {
      try { if (initialized) fixture('drop') } finally { rmSync(dir, { recursive: true, force: true }) }
    }
  }
  try {
    fixture('init')
    initialized = true
    const fields = ['DRAFT_PREVIEW_TOKEN', 'PGOPTIONS', 'CORS_ORIGINS', 'DEMO_CREATOR_SLUG', 'APP_ENV', 'OPENBLAS_NUM_THREADS']
    docker('compose', 'run', '--rm', '--detach', '--no-deps', '--name', container,
      '-p', '127.0.0.1::8000', ...fields.flatMap(key => ['-e', key]), 'api')
    started = true
    const apiPort = docker('port', container, '8000/tcp').split(':').at(-1)!
    const api = `http://127.0.0.1:${apiPort}`
    await waitHttp(api + '/health')
    const buildEnv = { ...process.env, VITE_DATA_MODE: 'api', VITE_API_BASE_URL: api, VITE_CREATOR_SLUG: 'demo' }
    const vite = path.resolve('node_modules/vite/bin/vite.js')
    execFileSync(process.execPath, [vite, 'build', '--mode', 'studio-e2e', '--outDir', dir], { env: buildEnv })
    const assets = path.join(dir, 'assets')
    for (const file of readdirSync(assets)) {
      if (readFileSync(path.join(assets, file)).includes(env.DRAFT_PREVIEW_TOKEN)) {
        throw new Error('Operator capability present in browser build')
      }
    }
    console.log('Local operator capability absent from built assets')
    server = spawn(process.execPath, [vite, 'preview', '--mode', 'studio-e2e', '--outDir', dir,
      '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
      env: { ...env, API_PORT: apiPort }, stdio: 'inherit',
    })
    await waitHttp(origin)
    return { origin, api, fixture, close }
  } catch (error) {
    await close()
    throw error
  }
}
