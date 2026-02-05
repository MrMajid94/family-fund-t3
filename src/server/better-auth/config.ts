import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";

import { db } from "@/server/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  // Use email/password authentication
  // Email format: {phoneNumber}@email.com, Password: {phoneNumber}
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username({
      // Phone number is both username and password
      minUsernameLength: 8,
      maxUsernameLength: 15,
    }),
    admin(),
  ],
  callbacks: {
    session: async ({ session, user }: { session: any; user: any }) => {
      return {
        ...session,
        user: {
          ...session.user,
          role: user.role,
        },
      };
    },
  },
});

export type Session = typeof auth.$Infer.Session;
