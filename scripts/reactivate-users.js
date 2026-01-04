const { neon } = require('@neondatabase/serverless');

// Connection string provided by user
const DATABASE_URL = "postgres://neondb_owner:npg_v0CKqcUzBk3I@ep-little-firefly-a2ve6ltk-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function reactivateUsers() {
  try {
    console.log("Fetching current users...");
    const users = await sql`SELECT id, unique_key, email, role, is_active, expires_at FROM users`;
    console.table(users);

    console.log("Updating expiry dates to 2030-01-01...");
    
    // Update all users to be active and expire in 2030
    const result = await sql`
      UPDATE users 
      SET expires_at = '2030-01-01T00:00:00Z',
          is_active = true
      RETURNING id, unique_key, expires_at
    `;

    console.log("Update successful!");
    console.table(result);
    
  } catch (error) {
    console.error("Error updating users:", error);
  }
}

reactivateUsers();
