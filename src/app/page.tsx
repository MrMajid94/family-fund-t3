import Hero from "@/components/hero";
import { getSession } from "@/server/better-auth/server";
import { api, HydrateClient } from "@/trpc/server";

export default async function Home() {

  return (
    <HydrateClient>
      <main>
        <Hero />
      </main>
    </HydrateClient>
  );
}
