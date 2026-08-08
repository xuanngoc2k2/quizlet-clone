import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/server/routers/_app"
import { createTRPCContext } from "@/server/trpc"

export const dynamic = "force-dynamic"
export const maxDuration = 300
export const runtime = "nodejs"

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req }),
  })

export { handler as GET, handler as POST }
