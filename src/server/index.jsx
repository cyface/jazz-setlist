import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { authMiddleware } from './middleware/auth.js'
import { arrangementsRoutes } from './routes/arrangements.js'
import { documentsRoutes } from './routes/documents.js'
import { meRoutes } from './routes/me.js'
import { setlistsRoutes } from './routes/setlists.js'
import { Shell } from './shell.jsx'

export const app = new Hono()

// Another site can't send JSON to the API without a CORS preflight, but it can post a form (a document upload is
// one) with the user's Access cookie. Browsers put Origin on every such request, so a change from another origin
// is refused. (Requests without Origin aren't from a page: tests, scripts.)
app.use('/api/*', async (c, next) => {
  const origin = c.req.header('origin')
  if (origin && origin !== new URL(c.req.url).origin && !['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    return c.json({ error: 'Cross-site request refused' }, 403)
  }
  await next()
})
app.use('/api/*', authMiddleware())
app.route('/api/me', meRoutes)
app.route('/api/arrangements', arrangementsRoutes)
app.route('/api/arrangements/:arrangementId/documents', documentsRoutes)
app.route('/api/setlists', setlistsRoutes)
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))

app.get('*', (c) =>
  c.html('<!doctype html>' + <Shell dev={import.meta.env.DEV} version={__APP_VERSION__} />),
)

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.res ?? c.json({ error: err.message }, err.status)
  }
  console.error(JSON.stringify({ error: err.message, stack: err.stack, path: c.req.path }))
  return c.json({ error: 'Internal error' }, 500)
})

export default app
