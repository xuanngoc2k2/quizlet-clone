import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import { prisma } from "@/server/db"

export const ADMIN_EMAIL = "xuanngoc2k2@gmail.com"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email?.toLowerCase() === ADMIN_EMAIL) {
        await prisma.user.updateMany({
          where: { email: ADMIN_EMAIL },
          data: { role: "ADMIN" },
        })
      }
      return true
    },
    authorized({ auth }) {
      return !!auth?.user
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role
        session.user.canUseAI = user.canUseAI
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
