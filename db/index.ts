import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as relations from './relations';
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
}

const sql = neon(process.env.DATABASE_URL);

// Merge schema and relations properly
const fullSchema = { ...schema, ...relations };

export const db = drizzle(sql, { schema: fullSchema });
