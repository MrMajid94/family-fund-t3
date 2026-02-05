
import { db } from "./server/db";
import { user } from "./server/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const foundUser = await db.query.user.findFirst({
    where: eq(user.phoneNumber, "95726373"),
  });
  
  if (foundUser) {
    console.log("User found:", JSON.stringify(foundUser, null, 2));
  } else {
    console.log("User not found");
  }
  
  const adminUser = await db.query.user.findFirst({
      where: eq(user.role, "admin")
  });
  console.log("Example admin user:", JSON.stringify(adminUser, null, 2));
  
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
