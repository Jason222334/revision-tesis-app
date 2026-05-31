import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { AuthResponseSchema } from "@revision-tesis/types"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
          method: "POST",
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" },
        })

        const data = await res.json()

        if (res.ok && data) {
          return {
            ...data.user,
            accessToken: data.accessToken
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role
        token.id = (user as any).id
        token.accessToken = (user as any).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session as any).accessToken = token.accessToken;
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
