import { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Google is only added as a provider once GOOGLE_CLIENT_ID/SECRET are actually set.
// This keeps the app working exactly as before if you haven't set up Google Cloud
// credentials yet — no crash, "Connect Google Calendar" just won't be offered.
const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          // Both users already have password-based accounts here. Signing in with Google
          // using that SAME email address should attach to that existing account rather
          // than erroring out or creating a second one. This is safe in this app's context
          // because it's a private, two-person tool and Google verifies email ownership —
          // it would not be an appropriate default for a public multi-tenant app.
          allowDangerousEmailAccountLinking: true,
          authorization: {
            params: {
              scope: "openid email profile https://www.googleapis.com/auth/calendar.events",
              access_type: "offline", // required to get a refresh_token back
              prompt: "consent", // forces the consent screen so we reliably get that refresh_token
            },
          },
        }),
      ]
    : [];

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma) as AuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...googleProvider,
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Session uses the JWT strategy, so name/email/image are normally only set once
      // at initial sign-in and won't reflect later profile edits until next login.
      // The account page calls the client-side `update()` from useSession() after a
      // successful save, which re-runs this callback with trigger === "update" so the
      // topbar/avatar reflect changes immediately instead of going stale.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (fresh) {
          token.name = fresh.name;
          token.email = fresh.email;
          token.picture = fresh.image;
          token.role = fresh.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        if (token.name !== undefined) session.user.name = token.name as string | null;
        if (token.email !== undefined) session.user.email = token.email as string | null;
        if (token.picture !== undefined) session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
