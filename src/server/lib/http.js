import { HTTPException } from 'hono/http-exception'

export async function parseBody(c, schema) {
  let body
  try {
    body = await c.req.json()
  } catch {
    throw new HTTPException(400, { message: 'Body must be JSON' })
  }
  const result = schema.safeParse(body)
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    throw new HTTPException(400, {
      res: Response.json({ error: 'Invalid input', issues }, { status: 400 }),
    })
  }
  return result.data
}

export function notFound(what) {
  return new HTTPException(404, { message: `${what} not found` })
}

export const now = () => new Date().toISOString()

export function omitUserId({ userId: _userId, ...rest }) {
  return rest
}
