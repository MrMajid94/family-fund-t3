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
      }),
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
            : sql`${payment.createdById} = ${ctx.session.user.id}`,
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
  getMyPayments: protectedProcedure.query(async ({ ctx }) => {
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
      lastPaymentDate: stats?.lastPaymentDate
        ? new Date(stats.lastPaymentDate)
        : null,
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
      if (
        targetUserId !== ctx.session.user.id &&
        ctx.session.user.role !== "admin"
      ) {
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
        payments: z
          .array(
            z.object({
              paymentForMonth: z.date(), // Which month this covers
              amount: z.string(), // Amount for this specific month
            }),
          )
          .min(1, "At least one payment is required"),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Only admins can create payments for other users
      if (
        input.userId !== ctx.session.user.id &&
        ctx.session.user.role !== "admin"
      ) {
        throw new Error(
          "Unauthorized: Only admins can create payments for other users",
        );
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
      }),
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
  // Get analysis for a specific user (Admin only)
  getUserAnalysis: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check admin permission
      if (ctx.session.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      // 1. Get User details (for start date)
      const user = await ctx.db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, input.userId),
      });

      if (!user) {
        throw new Error("User not found");
      }

      // 2. Get all payments for this user
      const userPayments = await ctx.db.query.payment.findMany({
        where: (p, { eq }) => eq(p.userId, input.userId),
        orderBy: [desc(payment.paymentForMonth)],
      });

      // 3. Get generic payment settings (years and amounts)
      const paymentYears = await ctx.db.query.paymentYear.findMany();
      const yearSettings = new Map(
        paymentYears.map((py) => [
          py.year,
          parseFloat(py.monthlyAmount || "10"),
        ]),
      );

      // 4. Generate month-by-month analysis
      const startDate = user.paymentStartDate;
      const currentDate = new Date(); // Today

      // Determine the analysis end date:
      // It should be at least the current month
      // AND extend to the last payment month if the user made advance payments
      let lastPaymentDate = currentDate;
      if (
        userPayments &&
        userPayments.length > 0 &&
        userPayments[0]?.paymentForMonth &&
        userPayments[0].paymentForMonth > currentDate
      ) {
        lastPaymentDate = userPayments[0].paymentForMonth;
      }

      // Normalize dates to start of month
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const currentMonthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const end = new Date(
        lastPaymentDate.getFullYear(),
        lastPaymentDate.getMonth(),
        1,
      );

      // Ensure end is at least current month (handle case where last payment was years ago)
      const finalEnd = end > currentMonthStart ? end : currentMonthStart;

      const analysis = [];
      let totalPaid = 0;
      let totalRequired = 0; // Required amount calculated ONLY up to current month
      let overdueMonthsCount = 0;

      const loopCurrent = new Date(start);
      // Iterate from start date to the computed end date
      while (loopCurrent <= finalEnd) {
        const yearStr = loopCurrent.getFullYear().toString();
        const monthStr = (loopCurrent.getMonth() + 1)
          .toString()
          .padStart(2, "0");

        // Expected amount for this month
        const requiredAmount = yearSettings.get(yearStr) ?? 10;

        // Find payment for this month
        const paidPayment = userPayments.find((p) => {
          const pDate = new Date(p.paymentForMonth);
          return (
            pDate.getFullYear() === loopCurrent.getFullYear() &&
            pDate.getMonth() === loopCurrent.getMonth()
          );
        });

        const isPaid = !!paidPayment;
        const paidAmount = isPaid ? parseFloat(paidPayment.amount) : 0;

        let status = "Overdue";

        // Logic breakdown:
        // 1. Future Month (Advance)
        if (loopCurrent > currentMonthStart) {
          status = isPaid ? "Paid" : "Upcoming";
        }
        // 2. Current Month
        else if (loopCurrent.getTime() === currentMonthStart.getTime()) {
          status = isPaid ? "Paid" : "Due"; // Due by end of month
          totalRequired += requiredAmount; // Current month IS required
        }
        // 3. Past Month
        else {
          status = isPaid ? "Paid" : "Overdue";
          totalRequired += requiredAmount; // Past months ARE required
          if (!isPaid) {
            overdueMonthsCount++;
          }
        }

        if (isPaid) {
          totalPaid += paidAmount;
        }

        analysis.push({
          date: new Date(loopCurrent),
          year: yearStr,
          month: monthStr,
          requiredAmount,
          paidAmount,
          status,
          note: paidPayment?.note,
          paymentId: paidPayment?.id,
          paymentDate: paidPayment?.paymentDate,
        });

        // Next month
        loopCurrent.setMonth(loopCurrent.getMonth() + 1);
      }

      // Sort analysis desc (newest first)
      analysis.reverse();

      return {
        user: {
          id: user.id,
          name: user.name,
          paymentStartDate: user.paymentStartDate,
        },
        summary: {
          totalPaid,
          totalRequired, // To Date (inclusive of current month)
          balance: totalPaid - totalRequired, // Positive = Surplus, Negative = Deficit
          overdueMonthsCount,
        },
        months: analysis,
      };
    }),
  // Get global compliance stats (Admin only)
  getGlobalCompliance: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    // 1. Fetch all users and valid payment years
    const users = await ctx.db.query.user.findMany({
      where: (u, { eq }) => eq(u.isActive, true), // Only active users
    });

    const paymentYears = await ctx.db.query.paymentYear.findMany();
    const yearSettings = new Map(
      paymentYears.map((py) => [py.year, parseFloat(py.monthlyAmount || "10")]),
    );

    // 2. Fetch all payments
    const allPayments = await ctx.db.query.payment.findMany();

    const currentDate = new Date();
    const currentMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    let totalUsers = 0;
    let compliantUsers = 0;
    let totalArrears = 0;
    let totalCollected = 0;

    const userStats: {
      id: string;
      name: string;
      overdueMonths: number;
      amountOwed: number;
      totalPaid: number;
    }[] = [];

    // 3. Process each user
    for (const user of users) {
      totalUsers++;

      const userPayments = allPayments.filter((p) => p.userId === user.id);

      const startDate = user.paymentStartDate;
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

      // End date is strictly the current month for "Arrears" calculation
      // We don't care about future for "Compliance" (you aren't validly compliant just because you paid next year if you missed this year)
      // Actually, if you have 0 overdue, you are compliant.

      let overdueCount = 0;
      let owedAmount = 0;
      let paidSum = 0;

      const loopCurrent = new Date(start);
      // Loop up to current month (inclusive) to find overdue/due
      while (loopCurrent < currentMonthStart) {
        // Strictly past months are OVERDUE
        const yearStr = loopCurrent.getFullYear().toString();
        const requiredAmount = yearSettings.get(yearStr) ?? 10;

        // Check if paid
        const isPaid = userPayments.some((p) => {
          const pDate = new Date(p.paymentForMonth);
          return (
            pDate.getFullYear() === loopCurrent.getFullYear() &&
            pDate.getMonth() === loopCurrent.getMonth()
          );
        });

        if (!isPaid) {
          overdueCount++;
          owedAmount += requiredAmount;
        }

        loopCurrent.setMonth(loopCurrent.getMonth() + 1);
      }

      // Calculate total paid by this user (overall)
      paidSum = userPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      totalCollected += paidSum;
      totalArrears += owedAmount;

      if (overdueCount === 0) {
        compliantUsers++;
      }

      userStats.push({
        id: user.id,
        name: user.name,
        overdueMonths: overdueCount,
        amountOwed: owedAmount,
        totalPaid: paidSum,
      });
    }

    // 4. Sort for rankings
    // Worst: Highest overdue count
    const worstPerforming = [...userStats]
      .sort((a, b) => b.overdueMonths - a.overdueMonths)
      .filter((u) => u.overdueMonths > 0)
      .slice(0, 5);

    // Best: 0 overdue, sorted by total paid (most loyal/generous)
    const topPerforming = [...userStats]
      .filter((u) => u.overdueMonths === 0)
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);

    return {
      totalUsers,
      compliantUsers,
      complianceRate: totalUsers > 0 ? (compliantUsers / totalUsers) * 100 : 0,
      totalArrears,
      totalCollected,
      worstPerforming,
      topPerforming,
    };
  }),
});
