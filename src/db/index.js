import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema.js'

export const createDb = (d1) => drizzle(d1, { schema })
