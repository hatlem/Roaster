import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    // Email/Password authentication
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) {
          throw new Error("Invalid credentials");
        }

        // Check if user has a password set
        if (!user.passwordHash) {
          throw new Error("Please use magic link to sign in");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
          role: user.role,
          organizationId: user.organizationId ?? undefined,
          hasPassword: true,
        };
      },
    }),

    // Magic link authentication
    CredentialsProvider({
      id: "magic-link",
      name: "Magic Link",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          throw new Error("Missing token");
        }

        const user = await prisma.user.findFirst({
          where: {
            magicLinkToken: credentials.token,
            magicLinkExpires: { gt: new Date() },
          },
        });

        if (!user || !user.isActive) {
          throw new Error("Invalid or expired magic link");
        }

        // Clear the magic link token after use
        await prisma.user.update({
          where: { id: user.id },
          data: {
            magicLinkToken: null,
            magicLinkExpires: null,
            lastLoginAt: new Date(),
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
          role: user.role,
          organizationId: user.organizationId ?? undefined,
          hasPassword: !!user.passwordHash,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.organizationId = (user as { organizationId?: string })
          .organizationId;
        token.hasPassword = (user as { hasPassword: boolean }).hasPassword;
      }

      // Handle session update (e.g., after password is set)
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { passwordHash: true, organizationId: true },
        });
        if (dbUser) {
          token.hasPassword = !!dbUser.passwordHash;
          token.organizationId = dbUser.organizationId ?? undefined;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { organizationId?: string }).organizationId =
          token.organizationId as string | undefined;
        (session.user as { hasPassword: boolean }).hasPassword =
          token.hasPassword as boolean;
      }
      return session;
    },
  },
};
