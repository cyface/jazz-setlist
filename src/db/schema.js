import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { DRUM_IMPLEMENTS, DRUMS_ENTRIES, FEELS } from '../shared/attributes.js'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').notNull(),
})

export const arrangements = sqliteTable(
  'arrangements',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    composer: text('composer'),
    musicalKey: text('musical_key'),
    tempo: integer('tempo').notNull(),
    beatsPerBar: integer('beats_per_bar').notNull().default(4),
    feel: text('feel', { enum: FEELS }).notNull(),
    drumImplement: text('drum_implement', { enum: DRUM_IMPLEMENTS }).notNull(),
    drumsEntry: text('drums_entry', { enum: DRUMS_ENTRIES }).notNull(),
    drumsEntryNote: text('drums_entry_note'),
    soloOrder: text('solo_order', { mode: 'json' }).notNull().default([]),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('arrangements_user_idx').on(t.userId)],
)

export const setlists = sqliteTable(
  'setlists',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    venue: text('venue'),
    showDate: text('show_date'),
    notes: text('notes'),
    // Set when the setlist is archived (kept, but out of the active list); null = active.
    archivedAt: text('archived_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [index('setlists_user_idx').on(t.userId)],
)

export const setlistItems = sqliteTable(
  'setlist_items',
  {
    id: text('id').primaryKey(),
    setlistId: text('setlist_id')
      .notNull()
      .references(() => setlists.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    kind: text('kind', { enum: ['tune', 'break'] }).notNull(),
    arrangementId: text('arrangement_id').references(() => arrangements.id, {
      onDelete: 'cascade',
    }),
    label: text('label'),
  },
  (t) => [
    index('setlist_items_setlist_idx').on(t.setlistId, t.position),
    index('setlist_items_arrangement_idx').on(t.arrangementId),
  ],
)
