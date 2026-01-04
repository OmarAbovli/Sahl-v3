
import { db } from "../db";
import { users } from "../db/schema";
import { eq, or } from "drizzle-orm";

async function checkUsers() {
    console.log("Checking for duplicate users...");

    // Check 'super_admin'
    const superAdmins = await db.query.users.findMany({
        where: eq(users.uniqueKey, 'super_admin')
    });
    console.log(`Found ${superAdmins.length} users with key 'super_admin':`);
    superAdmins.forEach(u => console.log(` - ID: ${u.id}, Role: ${u.role}, Email: ${u.email}`));

    // Check 'admin' (Company Admin)
    const companyAdmins = await db.query.users.findMany({
        where: eq(users.uniqueKey, 'admin')
    });
    console.log(`Found ${companyAdmins.length} users with key 'admin':`);
    companyAdmins.forEach(u => console.log(` - ID: ${u.id}, Role: ${u.role}, Email: ${u.email}`));

    process.exit(0);
}

checkUsers().catch(console.error);
