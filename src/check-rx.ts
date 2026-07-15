import prisma from './config/database';

async function main() {
  const prescriptions = await prisma.prescription.findMany({
    select: { prescriptionNo: true, expiryDate: true, createdAt: true },
  });
  prescriptions.forEach(p => {
    console.log(`${p.prescriptionNo} | expiry: ${p.expiryDate} | created: ${p.createdAt}`);
  });
  if (prescriptions.length === 0) console.log('No prescriptions found.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
