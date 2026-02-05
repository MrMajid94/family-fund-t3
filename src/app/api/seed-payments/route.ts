import { db } from "@/server/db";
import { oldPayments, seedUsers } from "@/lib/seed-data";
import { payment, user, account } from "@/server/db/schema";
import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // 1. Seed Users first
    console.log("Seeding Users...");
    let usersCreated = 0;
    
    for (const seedUser of seedUsers) {
      const existingUser = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.id, seedUser.id),
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(seedUser.phoneNumber, 10);
        
        await db.transaction(async (tx) => {
            await tx.insert(user).values({
            id: seedUser.id,
            name: seedUser.nameAr, // Use Arabic name
            phoneNumber: seedUser.phoneNumber,
            username: seedUser.phoneNumber,
            role: "user", // Default role
            createdAt: new Date(),
            updatedAt: new Date(),
            });

            await tx.insert(account).values({
            id: `acc_${seedUser.id}`,
            accountId: seedUser.phoneNumber,
            providerId: "credential",
            userId: seedUser.id,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
            });
        });
        console.log(`Created user: ${seedUser.nameAr}`);
        usersCreated++;
      }
    }

    // 2. Fetch users for mapping
    // Map English names (from seedUsers) to IDs so oldPayment matching works
    const userMap = new Map(seedUsers.map((u) => [u.name, u.id]));

    let created = 0;
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const p of oldPayments) {
      try {
        const userId = userMap.get(p.name);
        if (!userId) {
          skipped.push(`User not found: ${p.name}`);
          continue;
        }

        // Parse dates
        const paymentDate = new Date(p["payment date"]);
        const paymentForMonth = new Date(p["payment for month"]);

        await db.insert(payment).values({
          id: crypto.randomUUID(),
          userId: userId,
          createdById: userId,
          amount: p.amount,
          paymentDate: paymentDate,
          paymentForMonth: paymentForMonth,
          note: p.note,
          proof: p.proof,
        });

        created++;
      } catch (error) {
         // @ts-expect-error - error unknown
        errors.push(`Payment for ${p.name}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      usersCreated,
      paymentsCreated: created,
      skipped,
      errors,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error", details: error },
      { status: 500 }
    );
  }
}
