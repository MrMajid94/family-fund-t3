import { HydrateClient } from "@/trpc/server";
import MembersClientPage from "./client";

export default async function MembersPage() {
  return (
    <HydrateClient>
      <MembersClientPage />
    </HydrateClient>
  );
}
