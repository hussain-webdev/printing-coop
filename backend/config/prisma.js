import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Ensure DATABASE_URL is loaded before creating Prisma client
if (!process.env.DATABASE_URL) {
  console.error('[v0] ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

let prisma;

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  // AWS RDS requires SSL. Since Prisma 7 the driver enforces strict TLS,
  // and without an SSL config the query is rejected and surfaces as the
  // misleading P1010 "User was denied access on the database" error.
  // rejectUnauthorized: false trusts the RDS endpoint without needing the
  // downloaded CA bundle (fine for dev). For production, prefer trusting the
  // AWS RDS global CA bundle via NODE_EXTRA_CA_CERTS instead.
  const pool = new pg.Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = createPrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
