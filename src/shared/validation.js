import { z } from 'zod'
import { DRUM_IMPLEMENTS, DRUMS_ENTRIES, FEELS, TRADE_BARS } from './attributes.js'

const instrument = z.string().trim().toLowerCase().min(1).max(30)

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null)

export const soloEntrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solo'), instrument }),
  z.object({
    type: z.literal('trade'),
    instruments: z.array(instrument).min(2).max(6),
    bars: z.literal(TRADE_BARS),
  }),
  z.object({ type: z.literal('over_head'), instrument }),
])

export const arrangementInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    composer: optionalText(200),
    musicalKey: optionalText(20),
    tempo: z.number().int().min(20).max(400),
    beatsPerBar: z.number().int().min(1).max(12),
    feel: z.enum(FEELS),
    drumImplement: z.enum(DRUM_IMPLEMENTS),
    drumsEntry: z.enum(DRUMS_ENTRIES),
    drumsEntryNote: optionalText(200),
    soloOrder: z.array(soloEntrySchema).max(30),
    notes: optionalText(5000),
  })
  .transform((a) => (a.drumsEntry === 'top' ? { ...a, drumsEntryNote: null } : a))

export const setlistInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  venue: optionalText(200),
  showDate: z.iso
    .date()
    .nullish()
    .or(z.literal(''))
    .transform((v) => v || null),
  notes: optionalText(5000),
})

export const setlistItemsSchema = z.object({
  items: z
    .array(
      z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('tune'), arrangementId: z.string().min(1) }),
        z.object({ kind: z.literal('break'), label: optionalText(100) }),
      ]),
    )
    .max(200),
})
