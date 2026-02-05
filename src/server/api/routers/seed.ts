import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { archivedPayment, payment, user } from "@/server/db/schema";
import { oldPayments, seedUsers } from "@/lib/seed-data";
import { auth } from "@/server/better-auth";

export const seedRouter = createTRPCRouter({
  /**
   * Seed payments from old data
   */
    seedPayments: publicProcedure.mutation(async ({ ctx }) => {
    const results = {
      created: 0,
      skipped: [] as string[],
      errors: [] as string[],
      userMap: new Map(seedUsers.map(u => [u.name, u.nameAr]))
    };

    // Note: We don't link these to users anymore, just store the name
    
    for (const p of oldPayments) {
      try {
        // Parse dates - format is M/D/YY or M/D/YYYY
        const paymentDate = new Date(p["payment date"]);
        const paymentForMonth = new Date(p["payment for month"]);
        
        // Get Arabic name if available, otherwise fallback to English name
        const arabicName = results.userMap.get(p.name) ?? p.name;

        await ctx.db.insert(archivedPayment).values({
          id: crypto.randomUUID(),
          userName: arabicName, // Store Arabic name
          amount: p.amount,
          paymentDate: paymentDate,
          paymentForMonth: paymentForMonth,
          note: p.note,
          proof: p.proof,
        });

        results.created++;
      } catch (error) {
        results.errors.push(
          `Payment for ${p.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return {
      success: results.errors.length === 0,
      message: `Processed payments. Created: ${results.created}, Skipped: ${results.skipped.length}`,
      details: results,
    };
  }),

  /**
   * Public procedure to seed the database with sample users.
   * Uses Better Auth signUpEmail API to properly hash passwords.
   * Email format: {phoneNumber}@email.com
   * Password: {phoneNumber}
   */
  seedUsers: publicProcedure.mutation(async ({ ctx }) => {
    const results = {
      created: [] as string[],
      updated: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    for (const seedUser of seedUsers) {
      try {
        // Check if user already exists by phone number (username) or email
        const email = `${seedUser.phoneNumber}@email.com`;
        const existingUser = await ctx.db.query.user.findFirst({
          where: (users, { or, eq }) => or(
            eq(users.username, seedUser.phoneNumber),
            eq(users.email, email)
          ),
        });

        // specific payment start date or default to new system start (Jan 1, 2026)
        const paymentStartDate = seedUser.paymentStartDate 
          ? new Date(seedUser.paymentStartDate) 
          : new Date("2026-01-01");

        if (existingUser) {
          // Update existing user's name and payment start date
          await ctx.db
            .update(user)
            .set({ 
              name: seedUser.nameAr, // Update to Arabic name
              paymentStartDate 
            })
            .where(eq(user.id, existingUser.id));
            
          results.updated.push(seedUser.nameAr);
          continue;
        }

        // Use Better Auth signUpEmail API to create user with properly hashed password
        // Password is the phone number
        await auth.api.signUpEmail({
          headers: await headers(),
          body: {
            email: email,
            password: seedUser.phoneNumber,
            name: seedUser.nameAr, // Use Arabic name
          },
        });

        // Update the user with phone number, username, and payment start date
        // Note: auth.api.signUpEmail creates the user but might not set all fields we want (like username matching phone for non-email flows)
        await ctx.db
          .update(user)
          .set({ 
            phoneNumber: seedUser.phoneNumber,
            username: seedUser.phoneNumber,
            paymentStartDate: paymentStartDate,
          })
          .where(eq(user.email, email));

        results.created.push(seedUser.nameAr);
      } catch (error) {
        console.error(`Error seeding user ${seedUser.name}:`, error);
        results.errors.push(
          `${seedUser.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return {
      success: results.errors.length === 0,
      message: `Processed users. Created: ${results.created.length}, Updated: ${results.updated.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`,
      details: results,
    };
  }),

  /**
   * Get all users from the database
   */
  getUsers: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.query.user.findMany({
      orderBy: (users, { asc }) => [asc(users.name)],
    });
    return users;
  }),

  /**
   * Clear all seeded users from the database
   */
  clearUsers: publicProcedure.mutation(async ({ ctx }) => {
    const seedUserIds = seedUsers.map((u) => u.id);

    // Also delete by username (phone number) since Better Auth generates its own IDs
    let deletedCount = 0;
    
    // First try to delete by the seed IDs
    for (const id of seedUserIds) {
      try {
        await ctx.db.delete(user).where(eq(user.id, id));
        deletedCount++;
      } catch {
        // User might not exist, ignore
      }
    }

    // Also delete by username (phone number) for users created via Better Auth
    for (const seedUser of seedUsers) {
      try {
        await ctx.db
          .delete(user)
          .where(eq(user.username, seedUser.phoneNumber));
      } catch {
        // User might not exist, ignore
      }
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} seeded users`,
    };
  }),
});
