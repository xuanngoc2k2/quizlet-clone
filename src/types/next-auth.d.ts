import "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    canUseAI?: boolean
  }

  interface Session {
    user: {
      id: string
      role?: string
      canUseAI?: boolean
    } & Session["user"]
  }
}