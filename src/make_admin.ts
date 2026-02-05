
import { db } from "./server/db";
import { user } from "./server/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const phoneNumber = "95726373";
  
  await db
    .update(user)
    .set({ role: "admin" })
    .where(eq(user.phoneNumber, phoneNumber));
    
  console.log(`Updated user ${phoneNumber} to admin`);
  
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
