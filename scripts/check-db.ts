import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    console.log("Checking DB...");
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL not found");
        return;
    }
    const client = neon(url);

    try {
        const tables = await client`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        const tableNames = tables.map((r: any) => r.table_name);
        console.log("Tables in public schema:", tableNames);

        const requiredTables = ['leads', 'deals', 'activities', 'customers'];
        for (const table of requiredTables) {
            if (tableNames.includes(table)) {
                const count = await client([`SELECT count(*) FROM ${table}`] as any);
                console.log(`Table '${table}' exists. Count:`, count[0].count);
            } else {
                console.log(`Table '${table}' is MISSING!`);
            }
        }
    } catch (error: any) {
        console.error("Query failed:", error.message);
    }
}

check();
