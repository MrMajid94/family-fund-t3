import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { fundSpending } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

export const spendingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        amount: z.string(),
        reason: z.string(),
        recipient: z.string().optional(),
        date: z.date(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.insert(fundSpending).values({
        id: crypto.randomUUID(),
        amount: input.amount,
        reason: input.reason,
        recipient: input.recipient,
        date: input.date,
        note: input.note,
        createdById: ctx.session.user.id,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.string(),
        reason: z.string(),
        recipient: z.string().optional(),
        date: z.date(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .update(fundSpending)
        .set({
          amount: input.amount,
          reason: input.reason,
          recipient: input.recipient,
          date: input.date,
          note: input.note,
          updatedAt: new Date(),
        })
        .where(eq(fundSpending.id, input.id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(fundSpending)
        .where(eq(fundSpending.id, input.id));
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.fundSpending.findMany({
      orderBy: [desc(fundSpending.date)],
      with: {
        createdBy: true,
      },
    });
  }),

  // Statistics endpoint for all authenticated users
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Get all spendings to calculate total
    const allSpendings = await ctx.db.query.fundSpending.findMany({
      columns: {
        amount: true,
      },
    });

    const totalAmount = allSpendings.reduce(
      (sum, s) => sum + parseFloat(s.amount || "0"),
      0
    );

    // Get latest spending
    const latestSpending = await ctx.db.query.fundSpending.findFirst({
      orderBy: [desc(fundSpending.date)],
      columns: {
        amount: true,
        reason: true,
        date: true,
      },
    });

    return {
      totalAmount,
      count: allSpendings.length,
      latestSpending: latestSpending ?? null,
    };
  }),
});
