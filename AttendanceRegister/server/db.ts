import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Required for neon-serverless to work in Node.js
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to add it to your environment variables?");
}

export const dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(dbPool, { schema });
