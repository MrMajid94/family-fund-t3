import { HydrateClient, api } from "@/trpc/server";
import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import PaymentsClientPage from "./client";

export default async function PaymentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  // Prefetch paginated payments and stats
  void api.payment.getPaginated.prefetch({ page: 1, pageSize: 10 });
  void api.payment.getStats.prefetch();

  return (
    <HydrateClient>
      <PaymentsClientPage />
    </HydrateClient>
  );
}
