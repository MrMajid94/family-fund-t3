import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { bankBalance } from "@/server/db/schema";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";

export const bankBalanceRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        amount: z.string(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.insert(bankBalance).values({
        id: crypto.randomUUID(),
        amount: input.amount,
        note: input.note,
        createdById: ctx.session.user.id,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(bankBalance)
        .where(eq(bankBalance.id, input.id));
    }),

  getHistory: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return ctx.db.query.bankBalance.findMany({
      orderBy: [desc(bankBalance.createdAt)],
      with: {
        createdBy: true,
      },
    });
  }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return ctx.db.query.bankBalance.findFirst({
      orderBy: [desc(bankBalance.createdAt)],
    });
  }),

  // Public endpoint for all authenticated users to see fund balance
  getLatestPublic: protectedProcedure.query(async ({ ctx }) => {
    const latest = await ctx.db.query.bankBalance.findFirst({
      orderBy: [desc(bankBalance.createdAt)],
      columns: {
        amount: true,
        createdAt: true,
      },
    });
    return latest ?? null;
  }),
});
