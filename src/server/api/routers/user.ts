import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { auth } from "@/server/better-auth";
import { user } from "@/server/db/schema";
import { headers } from "next/headers";

export const userRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    // List all users.
    // In a real app, you might want to paginate this or limit fields.
    const users = await ctx.db.select().from(user).orderBy(user.createdAt);
    return users;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phoneNumber: z.string().min(8).max(15),
        password: z.string().min(6),
        role: z.enum(["admin", "user"]),
        paymentStartDate: z
          .date()
          .min(
            new Date("2026-01-01"),
            "تاريخ البدء يجب أن يكون من 2026 وما بعد",
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Role check: Only admins can create users
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create users",
        });
      }

      try {
        const newUser = await auth.api.createUser({
          headers: await headers(),
          body: {
            name: input.name,
            username: input.phoneNumber, // Phone number as username
            password: input.password,
            role: input.role,
            email: `${input.phoneNumber}@example.com`,
          } as any,
        });

        // Update the user to set the specific phoneNumber column and paymentStartDate
        await ctx.db
          .update(user)
          .set({
            phoneNumber: input.phoneNumber,
            username: input.phoneNumber, // Explicitly set username
            paymentStartDate: input.paymentStartDate,
          })
          .where(eq(user.id, newUser.user.id));

        return newUser.user;
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: e instanceof Error ? e.message : "Failed to create user",
        });
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        phoneNumber: z.string().min(8).max(15),
        role: z.enum(["admin", "user"]),
        paymentStartDate: z
          .date()
          .min(
            new Date("2026-01-01"),
            "تاريخ البدء يجب أن يكون من 2026 وما بعد",
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Role check: Only admins can update users
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update users",
        });
      }

      // Check if user exists
      const existingUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.id),
      });

      if (!existingUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      await ctx.db
        .update(user)
        .set({
          name: input.name,
          phoneNumber: input.phoneNumber,
          username: input.phoneNumber, // Keep username in sync with phone
          role: input.role,
          ...(input.paymentStartDate
            ? { paymentStartDate: input.paymentStartDate }
            : {}),
        })
        .where(eq(user.id, input.id));

      return { success: true };
    }),
});
