import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { authMiddleware } from './middleware/auth.js'
import { arrangementsRoutes } from './routes/arrangements.js'
import { setlistsRoutes } from './routes/setlists.js'
import { Shell } from './shell.jsx'

export const app = new Hono()

app.use('/api/*', authMiddleware())
app.get('/api/me', (c) => c.json({ user: c.get('user') }))
app.route('/api/arrangements', arrangementsRoutes)
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
