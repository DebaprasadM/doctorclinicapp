import prisma from './config/database';

async function main() {
  const result = await prisma.$executeRaw`
    UPDATE "Prescription"
    SET "expiryDate" = "createdAt" + INTERVAL '30 days'
    WHERE "expiryDate" IS NULL
  `;
  console.log(`Updated ${result} prescriptions with expiry dates`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
