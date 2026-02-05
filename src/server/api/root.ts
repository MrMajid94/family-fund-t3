import { bankBalanceRouter } from "@/server/api/routers/bank-balance";
import { seedRouter } from "@/server/api/routers/seed";
import { userRouter } from "@/server/api/routers/user";
import { paymentRouter } from "@/server/api/routers/payment";
import { settingsRouter } from "@/server/api/routers/settings";
import { spendingRouter } from "@/server/api/routers/spending";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  seed: seedRouter,
  payment: paymentRouter,
  settings: settingsRouter,
  spending: spendingRouter,
  bankBalance: bankBalanceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
