import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Required for neon-serverless to work in Node.js
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    console.error("FATAL ERROR: DATABASE_URL is not provided!");
    process.exit(1);
}

export const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(dbPool, { schema });
