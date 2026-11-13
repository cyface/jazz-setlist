import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema.js'
import { preferencesSchema } from '../../shared/validation.js'
import { parseBody } from '../lib/http.js'

export const meRoutes = new Hono()
  .get('/', (c) => c.json({ user: c.get('user') }))
  .put('/preferences', async (c) => {
    const preferences = await parseBody(c, preferencesSchema)
    await c.get('db').update(users).set({ preferences }).where(eq(users.id, c.get('user').id))
    return c.json({ preferences })
  })
