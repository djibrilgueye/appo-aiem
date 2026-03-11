import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { jwtVerify } from "jose"
import { prisma } from "./prisma"

const OTP_PROOF_SECRET = new TextEncoder().encode(
  (process.env.NEXTAUTH_SECRET ?? "fallback-secret") + "_otp_proof"
)

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:         { label: "Email",          type: "email" },
        otpProofToken: { label: "OTP Proof Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otpProofToken) {
          throw new Error("Missing credentials")
        }

        // Verify the short-lived OTP proof JWT issued by /api/auth/otp/verify
        let payload: { email: string; verified: boolean }
        try {
          const result = await jwtVerify(credentials.otpProofToken, OTP_PROOF_SECRET)
          payload = result.payload as typeof payload
        } catch {
          throw new Error("Invalid or expired verification token")
        }

        if (payload.email !== credentials.email || !payload.verified) {
          throw new Error("Verification mismatch")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.active) {
          throw new Error("User not found or inactive")
        }

        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          role:  user.role,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id   = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id   = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
