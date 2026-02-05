import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { paymentYear } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const settingsRouter = createTRPCRouter({
  // Get enabled years - available to all authenticated users
  getEnabledYears: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.paymentYear.findMany({
      where: eq(paymentYear.isEnabled, true),
      orderBy: desc(paymentYear.year),
    });
  }),

  getYears: protectedProcedure.query(async ({ ctx }) => {
    // Only admins should really be managing this, but for now we'll return all for display
    // If strict admin access is needed, check ctx.session.user.role
    
    // Check if user is admin
    if (ctx.session.user.role !== "admin") {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return await ctx.db.query.paymentYear.findMany({
      orderBy: desc(paymentYear.year),
    });
  }),

  toggleYear: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const existingYear = await ctx.db.query.paymentYear.findFirst({
        where: eq(paymentYear.id, input.id),
      });

      if (!existingYear) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Year not found",
        });
      }

      await ctx.db
        .update(paymentYear)
        .set({ isEnabled: !existingYear.isEnabled })
        .where(eq(paymentYear.id, input.id));

      return { success: true };
    }),

  addYear: protectedProcedure
    .input(z.object({ year: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const existingYear = await ctx.db.query.paymentYear.findFirst({
        where: eq(paymentYear.year, input.year),
      });

      if (existingYear) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Year already exists",
        });
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(paymentYear).values({
        id,
        year: input.year,
        isEnabled: false, // Default to disabled
      });

      return { success: true };
    }),
});
