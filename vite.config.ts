import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'

function createStashProxy(mode: string) {
  const env = loadEnv(mode, process.cwd(), '')
  const stashServerUrl =
    env.STASH_SERVER_URL?.trim() ||
    getServerUrlFromGraphQlEndpoint(env.VITE_STASH_GRAPHQL_ENDPOINT?.trim())
  const stashApiKey = env.STASH_API_KEY?.trim() || env.VITE_STASH_API_KEY?.trim()

  if (!stashServerUrl) {
    return undefined
  }

  const stashProxy: ProxyOptions = {
    target: stashServerUrl,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/stash/, ''),
    ...(stashApiKey ? { headers: { ApiKey: stashApiKey } } : {}),
  }

  return {
    '/stash': stashProxy,
  }
}

function getServerUrlFromGraphQlEndpoint(endpoint: string | undefined) {
  if (!endpoint) {
    return undefined
  }

  try {
    return new URL(endpoint).origin
  } catch {
    return undefined
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const stashProxy = createStashProxy(mode)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    ...(stashProxy ? { server: { proxy: stashProxy } } : {}),
  }
})
