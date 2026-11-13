import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { eq } from 'drizzle-orm'
import { createDb } from '../../db/index.js'
import { users } from '../../db/schema.js'

const isEmail = (v) => typeof v === 'string' && v.includes('@')
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

export async function findOrProvisionUser(db, email) {
  await db
    .insert(users)
    .values({ id: crypto.randomUUID(), email, createdAt: new Date().toISOString() })
    .onConflictDoNothing({ target: users.email })
  const user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user) throw new HTTPException(503, { message: 'Database unavailable' })
  return { id: user.id, email: user.email }
}

/**
 * Cloudflare Access sets CF-Access-Authenticated-User-Email on every request
 * it lets through. On localhost (no Access) DEV_AUTH_EMAIL from .env
 * stands in for it.
 */
export function authMiddleware() {
  return createMiddleware(async (c, next) => {
    let email = c.req.header('CF-Access-Authenticated-User-Email')
    if (!isEmail(email) && c.env.DEV_AUTH_EMAIL) {
      if (LOCAL_HOSTS.has(new URL(c.req.url).hostname)) email = c.env.DEV_AUTH_EMAIL
    }
    if (!isEmail(email)) throw new HTTPException(401, { message: 'Authentication required' })

    const db = createDb(c.env.DB)
    c.set('db', db)
    c.set('user', await findOrProvisionUser(db, email.trim().toLowerCase()))
    await next()
  })
}
