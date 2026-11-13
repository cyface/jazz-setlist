import pkg from './package.json' with { type: 'json' }

export const sharedConfig = {
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  oxc: { jsx: { runtime: 'automatic', importSource: 'hono/jsx' } },
}
