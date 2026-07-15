import prisma from './config/database';
import { hashPassword } from './utils/password';

async function main() {
  const clinic = await prisma.clinic.findFirst({ where: { name: 'City Healthcare Clinic' } });
  if (!clinic) { console.log('Clinic not found'); return; }

  const user = await prisma.user.create({
    data: {
      email: 'anita.das@cityhealthcare.com',
      password: await hashPassword('doctor123'),
      firstName: 'Anita',
      lastName: 'Das',
      role: 'DOCTOR',
      phone: '+91-9876543220',
      clinicId: clinic.id,
    },
  });

  const doctor = await prisma.doctor.create({
    data: {
      userId: user.id,
      specialization: 'Pediatrics',
      qualification: 'MBBS, DCH',
      registrationNo: 'DEL-MC-54321',
      consultationFee: 600,
      isClinicAdmin: true,
      availableDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      availableSlots: JSON.stringify(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30']),
      clinicId: clinic.id,
    },
  });

  console.log(`Dr. ${user.firstName} ${user.lastName} created (isClinicAdmin: true)`);
  console.log(`Email: ${user.email} | Password: doctor123`);
  console.log(`Doctor ID: ${doctor.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
