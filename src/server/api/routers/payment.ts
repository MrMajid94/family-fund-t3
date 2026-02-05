import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { archivedPayment, payment } from "@/server/db/schema";
import { desc, count, sql } from "drizzle-orm";

export const paymentRouter = createTRPCRouter({
  // Get all payments (existing, for backward compatibility)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.session.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return ctx.db.query.payment.findMany({
      orderBy: [desc(payment.paymentDate)],
      with: {
        user: true,
      },
    });
  }),

  // Get paginated payments
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;
      const offset = (page - 1) * pageSize;

      const whereClause =
        ctx.session.user.role === "admin"
          ? undefined
          : (payments: any, { eq }: any) =>
              eq(payments.createdById, ctx.session.user.id);

      // Get total count
      const [countResult] = await ctx.db
        .select({ total: count() })
        .from(payment)
        .where(
            ctx.session.user.role === "admin"
            ? undefined
            : sql`${payment.createdById} = ${ctx.session.user.id}`
        );
      const totalCount = countResult?.total ?? 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Get paginated payments
      const payments = await ctx.db.query.payment.findMany({
        where: whereClause,
        orderBy: [desc(payment.paymentDate)],
        with: {
          user: true,
        },
        limit: pageSize,
        offset,
      });

      return {
        payments,
        totalCount,
        totalPages,
        currentPage: page,
      };
    }),

  // Get payment statistics
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const whereClause =
      ctx.session.user.role === "admin"
        ? undefined
        : sql`${payment.createdById} = ${ctx.session.user.id}`;

    // Get total count and sum
    const [totals] = await ctx.db
      .select({
        totalPayments: count(),
        totalAmount: sql<string>`COALESCE(SUM(CAST(${payment.amount} AS DECIMAL)), 0)`,
      })
      .from(payment)
      .where(whereClause);

    // Get monthly aggregations for the chart
    const monthlyData = await ctx.db
      .select({
        month: sql<string>`TO_CHAR(${payment.paymentForMonth}, 'YYYY-MM')`,
        count: count(),
        amount: sql<string>`SUM(CAST(${payment.amount} AS DECIMAL))`,
      })
      .from(payment)
      .where(whereClause)
      .groupBy(sql`TO_CHAR(${payment.paymentForMonth}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${payment.paymentForMonth}, 'YYYY-MM')`);

    return {
      totalPayments: totals?.totalPayments ?? 0,
      totalAmount: parseFloat(totals?.totalAmount ?? "0"),
      monthlyData: monthlyData.map((m) => ({
        month: m.month,
        count: m.count,
        amount: parseFloat(m.amount ?? "0"),
      })),
    };
  }),

  // Public endpoint for total contributions (all authenticated users)
  getTotalContributions: protectedProcedure.query(async ({ ctx }) => {
    const [totals] = await ctx.db
      .select({
        totalPayments: count(),
        totalAmount: sql<string>`COALESCE(SUM(CAST(${payment.amount} AS DECIMAL)), 0)`,
      })
      .from(payment);

    return {
      totalPayments: totals?.totalPayments ?? 0,
      totalAmount: parseFloat(totals?.totalAmount ?? "0"),
    };
  }),

  // Get my payments (logged in user)
  getMyPayments: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.query.payment.findMany({
        where: (payments, { eq }) => eq(payments.userId, ctx.session.user.id),
        orderBy: [desc(payment.paymentForMonth)],
      });
    }),

  // Get my stats
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    // Get total amount paid
    const [stats] = await ctx.db
      .select({
        totalAmount: sql<string>`COALESCE(SUM(CAST(${payment.amount} AS DECIMAL)), 0)`,
        lastPaymentDate: sql<string>`MAX(${payment.paymentDate})`,
      })
      .from(payment)
      .where(sql`${payment.userId} = ${ctx.session.user.id}`);

    // Get payment start date for the user
    const dbUser = await ctx.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.id, ctx.session.user.id),
      columns: {
        paymentStartDate: true,
      },
    });

    return {
      totalAmount: parseFloat(stats?.totalAmount ?? "0"),
      lastPaymentDate: stats?.lastPaymentDate ? new Date(stats.lastPaymentDate) : null,
      paymentStartDate: dbUser?.paymentStartDate ?? new Date(),
    };
  }),

  // Export all payments for Excel
  exportAll: protectedProcedure.query(async ({ ctx }) => {
    const whereClause =
      ctx.session.user.role === "admin"
        ? undefined
        : (payments: any, { eq }: any) =>
            eq(payments.createdById, ctx.session.user.id);

    const allPayments = await ctx.db.query.payment.findMany({
      where: whereClause,
      orderBy: [desc(payment.paymentDate)],
      with: {
        user: true,
      },
    });

    // Return formatted data for Excel export
    return allPayments.map((p) => ({
      id: p.id,
      userName: p.user.name,
      amount: p.amount,
      paymentDate: p.paymentDate,
      paymentForMonth: p.paymentForMonth,
      note: p.note ?? "",
      proof: p.proof ?? "",
    }));
  }),

  // Get archived payments (Admin only)
  getArchivedPayments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return ctx.db.query.archivedPayment.findMany({
      orderBy: [desc(archivedPayment.paymentDate)],
    });
  }),

  // Get paid months for a user (to filter out from selection)
  getPaidMonths: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Determine which user to check
      const targetUserId = input.userId ?? ctx.session.user.id;
      
      // Only admins can view other users' paid months
      if (targetUserId !== ctx.session.user.id && ctx.session.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const payments = await ctx.db.query.payment.findMany({
        where: (payments, { eq }) => eq(payments.userId, targetUserId),
        columns: {
          paymentForMonth: true,
        },
      });

      // Return array of month strings in "YYYY-MM" format
      return payments.map((p) => {
        const date = new Date(p.paymentForMonth);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      });
    }),

  // Create new payment(s)
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string(), // Who the payment is for
        payments: z.array(
          z.object({
            paymentForMonth: z.date(), // Which month this covers
            amount: z.string(), // Amount for this specific month
          })
        ).min(1, "At least one payment is required"),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only admins can create payments for other users
      if (input.userId !== ctx.session.user.id && ctx.session.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can create payments for other users");
      }

      const createdPayments = [];
      const paymentDate = new Date();

      for (const p of input.payments) {
        const id = crypto.randomUUID();
        await ctx.db.insert(payment).values({
          id,
          userId: input.userId,
          createdById: ctx.session.user.id,
          amount: p.amount,
          paymentDate,
          paymentForMonth: p.paymentForMonth,
          note: input.note,
        });
        createdPayments.push(id);
      }

      return { success: true, paymentIds: createdPayments };
    }),

  // Update payment
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        amount: z.string().optional(),
        paymentForMonth: z.date().optional(),
        note: z.string().optional(),
        proof: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingPayment = await ctx.db.query.payment.findFirst({
        where: (payments, { eq }) => eq(payments.id, input.id),
      });

      if (!existingPayment) {
        throw new Error("Payment not found");
      }

      // Check permissions
      if (
        ctx.session.user.role !== "admin" &&
        existingPayment.createdById !== ctx.session.user.id
      ) {
        throw new Error("Unauthorized");
      }

      await ctx.db
        .update(payment)
        .set({
          amount: input.amount,
          paymentForMonth: input.paymentForMonth,
          note: input.note,
          proof: input.proof,
          updatedAt: new Date(),
        })
        .where(sql`${payment.id} = ${input.id}`);

      return { success: true };
    }),

  // Delete payment
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingPayment = await ctx.db.query.payment.findFirst({
        where: (payments, { eq }) => eq(payments.id, input.id),
      });

      if (!existingPayment) {
        throw new Error("Payment not found");
      }

      // Check permissions
      if (
        ctx.session.user.role !== "admin" &&
        existingPayment.createdById !== ctx.session.user.id
      ) {
        throw new Error("Unauthorized");
      }

      await ctx.db.delete(payment).where(sql`${payment.id} = ${input.id}`);

      return { success: true };
    }),
});
