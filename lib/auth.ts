import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcrypt";

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        console.log("🔐 [AUTH] Próba logowania:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ [AUTH] Brak email lub hasła");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          console.log("❌ [AUTH] Użytkownik nie istnieje:", credentials.email);
          return null;
        }

        console.log("✅ [AUTH] Użytkownik znaleziony:", user.email);

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        console.log("🔑 [AUTH] Hasło poprawne?", passwordMatch);

        if (!passwordMatch) {
          console.log("❌ [AUTH] Nieprawidłowe hasło");
          return null;
        }

        console.log("✅ [AUTH] Logowanie udane!");
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  debug: true, // Włącz debugowanie
} satisfies NextAuthConfig;