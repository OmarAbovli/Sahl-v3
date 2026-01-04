import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgres://neondb_owner:npg_v0CKqcUzBk3I@ep-little-firefly-a2ve6ltk-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(DATABASE_URL);

async function inspectSchema() {
    try {
        console.log("Fetching list of tables...");
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.table(tables);

        for (const table of tables) {
            const tableName = table.table_name;
            console.log(`\nSchema for table: ${tableName}`);
            const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = ${tableName}
      `;
            console.table(columns);

            const constraints = await sql`
        SELECT
            tc.constraint_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = ${tableName};
      `;
            if (constraints.length > 0) {
                console.log(`Foreign Keys for ${tableName}:`);
                console.table(constraints);
            } else {
                console.log(`No Foreign Keys found for ${tableName}`);
            }
        }

    } catch (error) {
        console.error("Error inspecting schema:", error);
    }
}

inspectSchema();
