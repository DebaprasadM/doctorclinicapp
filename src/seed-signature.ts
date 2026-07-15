import { PrismaClient } from '@prisma/client';
import { uploadToCloudinary } from './config/cloudinary';

const prisma = new PrismaClient();

const signatures = [
  // Doctor 1 - flowing cursive
  `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="70" viewBox="0 0 280 70">
  <path d="M15 48 Q25 18 42 40 Q52 52 62 38 Q72 24 85 46 Q95 58 105 40 Q112 30 122 48" stroke="#1a365d" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M130 44 Q140 22 155 44 Q165 56 175 36 Q182 24 192 44 Q200 58 210 40" stroke="#1a365d" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M42 54 Q80 50 120 55 Q160 58 200 52 Q220 48 240 54" stroke="#1a365d" stroke-width="1.2" fill="none" stroke-linecap="round"/>
</svg>`,
  // Doctor 2 - sharp angular
  `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="70" viewBox="0 0 280 70">
  <path d="M18 50 L30 20 L45 48 L58 22 L70 48" stroke="#1e3a5f" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M80 45 Q95 18 110 45 Q120 56 130 40" stroke="#1e3a5f" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M140 42 Q155 15 170 42 Q180 55 190 38" stroke="#1e3a5f" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M25 56 L220 56" stroke="#1e3a5f" stroke-width="1" fill="none"/>
</svg>`,
  // Doctor 3 - round smooth
  `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="70" viewBox="0 0 280 70">
  <path d="M20 45 C30 15 55 15 60 45 C65 58 80 58 85 42 C90 25 110 25 115 45" stroke="#047857" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M125 42 C135 18 155 18 162 42 C168 56 180 56 188 40" stroke="#047857" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M30 55 C70 50 110 58 150 52 C180 48 210 55 230 52" stroke="#047857" stroke-width="1" fill="none" stroke-linecap="round"/>
</svg>`,
];

async function main() {
  const doctors = await prisma.doctor.findMany({
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  if (doctors.length === 0) {
    console.log('No doctors found.');
    return;
  }

  for (let i = 0; i < doctors.length; i++) {
    const doctor = doctors[i];
    const svg = signatures[i % signatures.length];
    const buffer = Buffer.from(svg);

    console.log(`Uploading signature ${i + 1}/${doctors.length} for Dr. ${doctor.user.firstName} ${doctor.user.lastName}...`);
    const url = await uploadToCloudinary(buffer, 'doctor-signatures');

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { signature: url },
    });

    console.log(`  ✓ ${url}`);
  }

  console.log(`\nDone! ${doctors.length} signatures seeded.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
