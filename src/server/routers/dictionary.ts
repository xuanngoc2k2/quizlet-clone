import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { prisma } from "../db"
import { callGeminiJSON } from "../lib/gemini"
import type { Prisma } from "@prisma/client"
import {
  buildDictionaryPrompt,
  dictionaryResultSchema,
  normalizeCacheKey,
  type DictionaryResult,
  type Lang,
} from "@/lib/dictionary"

export const dictionaryRouter = router({
  lookup: publicProcedure
    .input(
      z.object({
        text: z.string().min(1, "Query is required").max(500),
        from: z.enum(["ko", "vi"]),
        to: z.enum(["ko", "vi"]),
      }),
    )
    .mutation(async ({ input }) => {
      const { text, from, to } = input
      const cacheKey = `${from}->${to}:${normalizeCacheKey(text)}`

      const cached = await prisma.dictionaryEntry.findUnique({
        where: { cacheKey },
      })
      if (cached) {
        return {
          cached: true,
          query: text,
          from,
          to,
          result: cached.result as unknown as DictionaryResult,
        }
      }

      const raw = await callGeminiJSON(buildDictionaryPrompt(text, from, to), {
        temperature: 0.3,
        maxTokens: 4096,
      })
      const result = dictionaryResultSchema.parse(raw)

      await prisma.dictionaryEntry
        .create({
          data: {
            cacheKey,
            text,
            from,
            to,
            result: result as unknown as Prisma.InputJsonValue,
          },
        })
        .catch(() => {
          // concurrent duplicate lookup — the first write wins, result is still valid
        })

      return {
        cached: false,
        query: text,
        from,
        to,
        result,
      }
    }),
})

export type LookupResponse = {
  cached: boolean
  query: string
  from: Lang
  to: Lang
  result: DictionaryResult
}
