import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/** Only keep small http(s) avatar URLs — base64 blows cookie size → 494 */
function safeImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("data:")) return null;
  if (url.length > 500) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return null;
}

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

providers.push(
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = String(credentials.email).trim().toLowerCase();

      const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });

      if (!user || !user.password) {
        return null;
      }

      if (user.isBanned) {
        return null;
      }

      const isValid = await bcrypt.compare(
        String(credentials.password),
        user.password
      );

      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: safeImage(user.image),
        role: user.role,
      };
    },
  })
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Drop any fat fields that Auth might copy in
      delete (token as { picture?: unknown }).picture;
      if (typeof token.image === "string" && token.image.startsWith("data:")) {
        token.image = null;
      }

      if (user) {
        token.role = (user as { role?: string }).role || "USER";
        token.id = user.id;
        token.picture = safeImage(user.image) || undefined;
        token.image = safeImage(user.image);
      }

      // Google profile photo is a normal URL — keep it small only
      if (account?.provider === "google" && profile) {
        const g = profile as { picture?: string; email?: string; name?: string };
        token.picture = safeImage(g.picture) || undefined;
        if (g.email) token.email = g.email;
        if (g.name) token.name = g.name;

        // ensure role from DB after Google login
        try {
          if (g.email) {
            const dbUser = await prisma.user.findFirst({
              where: { email: { equals: g.email, mode: "insensitive" } },
              select: { id: true, role: true, isBanned: true },
            });
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.isBanned ? "BANNED" : dbUser.role;
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (token.id && !user && account?.provider !== "google") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, isBanned: true },
          });
          if (dbUser?.isBanned) token.role = "BANNED";
          else if (dbUser?.role) token.role = dbUser.role;
        } catch {
          /* ignore */
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { id?: string }).id = token.id as string;
        session.user.image = safeImage(
          (token.image as string) || (token.picture as string)
        );
      }
      return session;
    },
  },
});
