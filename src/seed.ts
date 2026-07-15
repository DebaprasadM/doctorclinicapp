import prisma from './config/database';
import { hashPassword } from './utils/password';
import { logger } from './config/logger';

async function main() {
  logger.info('Seeding database...');

  // Clean existing data
  await prisma.prescriptionMedicine.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.clinicSetting.deleteMany();
  await prisma.clinic.deleteMany();

  // Create default clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'City Healthcare Clinic',
      email: 'info@cityhealthcare.com',
      phone: '+91-9876543210',
      address: '123, Healthcare Avenue, New Delhi - 110001',
    },
  });

  logger.info(`Clinic created: ${clinic.name}`);

  // Create super admin
  const superAdminPassword = await hashPassword('admin123');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@clinic.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      phone: '+91-9999999999',
    },
  });

  // Create clinic admin
  const adminPassword = await hashPassword('admin123');
  const clinicAdmin = await prisma.user.create({
    data: {
      email: 'admin@cityhealthcare.com',
      password: adminPassword,
      firstName: 'Clinic',
      lastName: 'Admin',
      role: 'CLINIC_ADMIN',
      phone: '+91-9876543211',
      clinicId: clinic.id,
    },
  });

  // Create doctors
  const doctor1User = await prisma.user.create({
    data: {
      email: 'rajesh.sharma@cityhealthcare.com',
      password: await hashPassword('doctor123'),
      firstName: 'Rajesh',
      lastName: 'Sharma',
      role: 'DOCTOR',
      phone: '+91-9876543212',
      clinicId: clinic.id,
    },
  });

  const doctor1 = await prisma.doctor.create({
    data: {
      userId: doctor1User.id,
      specialization: 'General Physician',
      qualification: 'MBBS, MD (Internal Medicine)',
      registrationNo: 'DEL-MC-12345',
      consultationFee: 500,
      availableDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      availableSlots: JSON.stringify(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']),
      clinicId: clinic.id,
    },
  });

  const doctor2User = await prisma.user.create({
    data: {
      email: 'priya.singh@cityhealthcare.com',
      password: await hashPassword('doctor123'),
      firstName: 'Priya',
      lastName: 'Singh',
      role: 'DOCTOR',
      phone: '+91-9876543213',
      clinicId: clinic.id,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      userId: doctor2User.id,
      specialization: 'Pediatrician',
      qualification: 'MBBS, MD (Pediatrics)',
      registrationNo: 'DEL-MC-12346',
      consultationFee: 600,
      availableDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']),
      availableSlots: JSON.stringify(['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '15:00', '15:30', '16:00', '16:30']),
      clinicId: clinic.id,
    },
  });

  const doctor3User = await prisma.user.create({
    data: {
      email: 'amit.kumar@cityhealthcare.com',
      password: await hashPassword('doctor123'),
      firstName: 'Amit',
      lastName: 'Kumar',
      role: 'DOCTOR',
      phone: '+91-9876543214',
      clinicId: clinic.id,
    },
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      userId: doctor3User.id,
      specialization: 'Cardiologist',
      qualification: 'MBBS, MD (Cardiology), DM',
      registrationNo: 'DEL-MC-12347',
      consultationFee: 1000,
      availableDays: JSON.stringify(['Monday', 'Wednesday', 'Friday']),
      availableSlots: JSON.stringify(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']),
      clinicId: clinic.id,
    },
  });

  // Create a second clinic for multi-clinic demo
  const clinic2 = await prisma.clinic.create({
    data: {
      name: 'Green Valley Hospital',
      email: 'info@greenvalley.com',
      phone: '+91-9876543300',
      address: '456, Green Valley Road, Mumbai - 400001',
    },
  });

  const clinic2Admin = await prisma.user.create({
    data: {
      email: 'admin@greenvalley.com',
      password: await hashPassword('admin123'),
      firstName: 'Mumbai',
      lastName: 'Admin',
      role: 'CLINIC_ADMIN',
      phone: '+91-9876543301',
      clinicId: clinic2.id,
    },
  });

  const doctor4User = await prisma.user.create({
    data: {
      email: 'sneha.patel@greenvalley.com',
      password: await hashPassword('doctor123'),
      firstName: 'Sneha',
      lastName: 'Patel',
      role: 'DOCTOR',
      phone: '+91-9876543302',
      clinicId: clinic2.id,
    },
  });

  const doctor4 = await prisma.doctor.create({
    data: {
      userId: doctor4User.id,
      specialization: 'Gynecologist',
      qualification: 'MBBS, MD (Obstetrics & Gynecology)',
      registrationNo: 'MUM-MC-12345',
      consultationFee: 800,
      availableDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
      availableSlots: JSON.stringify(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00']),
      clinicId: clinic2.id,
    },
  });

  const doctor5User = await prisma.user.create({
    data: {
      email: 'vijay.joshi@greenvalley.com',
      password: await hashPassword('doctor123'),
      firstName: 'Vijay',
      lastName: 'Joshi',
      role: 'DOCTOR',
      phone: '+91-9876543303',
      clinicId: clinic2.id,
    },
  });

  const doctor5 = await prisma.doctor.create({
    data: {
      userId: doctor5User.id,
      specialization: 'Orthopedic Surgeon',
      qualification: 'MBBS, MS (Orthopedics)',
      registrationNo: 'MUM-MC-12346',
      consultationFee: 1200,
      availableDays: JSON.stringify(['Monday', 'Tuesday', 'Thursday', 'Friday']),
      availableSlots: JSON.stringify(['10:00', '10:30', '11:00', '11:30', '15:00', '15:30', '16:00']),
      clinicId: clinic2.id,
    },
  });

  // Create receptionist
  const receptionistPassword = await hashPassword('reception123');
  await prisma.user.create({
    data: {
      email: 'reception@cityhealthcare.com',
      password: receptionistPassword,
      firstName: 'Sita',
      lastName: 'Verma',
      role: 'RECEPTIONIST',
      phone: '+91-9876543215',
      clinicId: clinic.id,
    },
  });

  // Create departments
  const departments = [
    { name: 'General Medicine', code: 'GEN', description: 'General OPD consultations' },
    { name: 'Pediatrics', code: 'PED', description: 'Child healthcare' },
    { name: 'Cardiology', code: 'CAR', description: 'Heart care' },
    { name: 'Orthopedics', code: 'ORT', description: 'Bone and joint care' },
    { name: 'Ophthalmology', code: 'EYE', description: 'Eye care' },
    { name: 'ENT', code: 'ENT', description: 'Ear, Nose, Throat' },
    { name: 'Dermatology', code: 'DER', description: 'Skin care' },
  ];

  for (const dept of departments) {
    await prisma.department.create({ data: { ...dept, clinicId: clinic.id } });
  }

  // Create sample patients
  const patients = [
    { firstName: 'Rahul', lastName: 'Verma', gender: 'MALE', age: 35, phone: '+91-9876543201', bloodGroup: 'A+', address: '101, Green Park, New Delhi' },
    { firstName: 'Sunita', lastName: 'Gupta', gender: 'FEMALE', age: 28, phone: '+91-9876543202', bloodGroup: 'B+', address: '202, Saket, New Delhi' },
    { firstName: 'Amit', lastName: 'Patel', gender: 'MALE', age: 45, phone: '+91-9876543203', bloodGroup: 'O+', address: '303, Dwarka, New Delhi' },
    { firstName: 'Priyanka', lastName: 'Chopra', gender: 'FEMALE', age: 32, phone: '+91-9876543204', bloodGroup: 'AB+', address: '404, Rohini, New Delhi' },
    { firstName: 'Vijay', lastName: 'Singh', gender: 'MALE', age: 55, phone: '+91-9876543205', bloodGroup: 'B-', address: '505, Ghaziabad, UP' },
    { firstName: 'Neha', lastName: 'Agarwal', gender: 'FEMALE', age: 25, phone: '+91-9876543206', bloodGroup: 'O-', address: '606, Noida, UP' },
    { firstName: 'Deepak', lastName: 'Yadav', gender: 'MALE', age: 40, phone: '+91-9876543207', bloodGroup: 'A-', address: '707, Faridabad, Haryana' },
    { firstName: 'Kavita', lastName: 'Sharma', gender: 'FEMALE', age: 30, phone: '+91-9876543208', bloodGroup: 'AB-', address: '808, Gurgaon, Haryana' },
    { firstName: 'Raj', lastName: 'Kumar', gender: 'MALE', age: 60, phone: '+91-9876543209', bloodGroup: 'A+', address: '909, Lajpat Nagar, New Delhi' },
    { firstName: 'Pooja', lastName: 'Mehta', gender: 'FEMALE', age: 22, phone: '+91-9876543210', bloodGroup: 'B+', address: '100, Connaught Place, New Delhi' },
  ];

  const createdPatients = [];
  for (const patient of patients) {
    const created = await prisma.patient.create({
      data: {
        ...patient,
        patientId: `PT-CITY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        clinicId: clinic.id,
      },
    });
    createdPatients.push(created);
  }

  // More patients for clinic 1
  const morePatients1 = [
    { firstName: 'Arun', lastName: 'Nair', gender: 'MALE', age: 42, phone: '+91-9876543216', bloodGroup: 'O+', address: '111, Vasant Kunj, New Delhi', email: 'arun.nair@email.com', occupation: 'Software Engineer' },
    { firstName: 'Meera', lastName: 'Iyer', gender: 'FEMALE', age: 31, phone: '+91-9876543217', bloodGroup: 'A+', address: '222, Karol Bagh, New Delhi', email: 'meera.iyer@email.com', occupation: 'Teacher' },
    { firstName: 'Suresh', lastName: 'Reddy', gender: 'MALE', age: 50, phone: '+91-9876543218', bloodGroup: 'AB+', address: '333, Jubilee Hills, Hyderabad', occupation: 'Business Owner' },
    { firstName: 'Anita', lastName: 'Desai', gender: 'FEMALE', age: 27, phone: '+91-9876543219', bloodGroup: 'O-', address: '444, Andheri West, Mumbai', email: 'anita.desai@email.com', occupation: 'Nurse' },
    { firstName: 'Ravi', lastName: 'Menon', gender: 'MALE', age: 65, phone: '+91-9876543220', bloodGroup: 'A-', address: '555, Marine Drive, Kochi', occupation: 'Retired' },
    { firstName: 'Divya', lastName: 'Kapoor', gender: 'FEMALE', age: 34, phone: '+91-9876543221', bloodGroup: 'B-', address: '666, Civil Lines, Kanpur', email: 'divya.kapoor@email.com', occupation: 'Lawyer' },
    { firstName: 'Mohan', lastName: 'Das', gender: 'MALE', age: 48, phone: '+91-9876543222', bloodGroup: 'A+', address: '777, Lake Town, Kolkata', occupation: 'Government Employee' },
    { firstName: 'Laxmi', lastName: 'Prasad', gender: 'FEMALE', age: 55, phone: '+91-9876543223', bloodGroup: 'O+', address: '888, Indira Nagar, Lucknow', occupation: 'Housewife' },
    { firstName: 'Karan', lastName: 'Thakur', gender: 'MALE', age: 29, phone: '+91-9876543224', bloodGroup: 'AB-', address: '999, Model Town, Chandigarh', email: 'karan.thakur@email.com', occupation: 'Fitness Trainer' },
    { firstName: 'Seema', lastName: 'Bajaj', gender: 'FEMALE', age: 38, phone: '+91-9876543225', bloodGroup: 'B+', address: '1010, CP Colony, Bhopal', occupation: 'CA' },
  ];

  for (const patient of morePatients1) {
    const created = await prisma.patient.create({
      data: {
        ...patient,
        patientId: `PT-CITY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        clinicId: clinic.id,
      },
    });
    createdPatients.push(created);
  }

  // Patients for clinic 2 (Green Valley)
  const patientsClinic2 = [
    { firstName: 'Akash', lastName: 'Shah', gender: 'MALE', age: 33, phone: '+91-9876543226', bloodGroup: 'A+', address: '12, Bandra West, Mumbai', email: 'akash.shah@email.com', occupation: 'Architect' },
    { firstName: 'Rekha', lastName: 'Patil', gender: 'FEMALE', age: 45, phone: '+91-9876543227', bloodGroup: 'O+', address: '34, Dadar East, Mumbai', occupation: 'School Principal' },
    { firstName: 'Imran', lastName: 'Khan', gender: 'MALE', age: 52, phone: '+91-9876543228', bloodGroup: 'B+', address: '56, Malad West, Mumbai', occupation: 'Film Producer' },
    { firstName: 'Nisha', lastName: 'Shinde', gender: 'FEMALE', age: 26, phone: '+91-9876543229', bloodGroup: 'AB+', address: '78, Thane West, Mumbai', email: 'nisha.shinde@email.com', occupation: 'Graphic Designer' },
    { firstName: 'Prakash', lastName: 'Naik', gender: 'MALE', age: 58, phone: '+91-9876543230', bloodGroup: 'A-', address: '90, Navi Mumbai', occupation: 'Bank Manager' },
  ];

  for (const patient of patientsClinic2) {
    await prisma.patient.create({
      data: {
        ...patient,
        patientId: `PT-GREEN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        clinicId: clinic2.id,
      },
    });
  }

  // Create clinic settings
  const settings = [
    { key: 'whatsappEnabled', value: 'false', description: 'WhatsApp integration enabled' },
    { key: 'consultationFees', value: JSON.stringify({ general: 500, followUp: 300, emergency: 750 }), description: 'Consultation fee structure' },
    { key: 'prescriptionTemplate', value: JSON.stringify({ showLogo: true, showDoctorSignature: true, showQRCode: true, headerColor: '#1a365d', fontSize: 'normal' }), description: 'Prescription template settings' },
    { key: 'whatsappTemplateName', value: '"prescription_ready"', description: 'WhatsApp message template' },
    { key: 'prescriptionExpiryDays', value: '30', description: 'Days until prescription link expires' },
  ];

  for (const setting of settings) {
    await prisma.clinicSetting.create({ data: { ...setting, clinicId: clinic.id } });
  }

  // Create some sample visits with payments and prescriptions
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Create visits for yesterday (completed)
  for (let i = 0; i < 5; i++) {
    const visit = await prisma.visit.create({
      data: {
        patientId: createdPatients[i].id,
        doctorId: i % 2 === 0 ? doctor1.id : doctor2.id,
        clinicId: clinic.id,
        tokenNumber: i + 1,
        consultationType: i === 2 ? 'EMERGENCY' : 'GENERAL',
        status: 'COMPLETED',
        symptoms: i % 2 === 0 ? 'Fever and cough for 3 days' : 'Headache and body ache',
        diagnosis: i % 2 === 0 ? 'Viral fever' : 'Migraine',
        vitals: JSON.stringify({ bloodPressure: '120/80', pulse: 72, temperature: 98.6, weight: 70 }),
        visitDate: yesterday,
        createdById: clinicAdmin.id,
      },
    });

    await prisma.payment.create({
      data: {
        receiptNumber: `RCP-TEST-${i + 100}`,
        amount: i % 2 === 0 ? 500 : 600,
        discount: 0,
        netAmount: i % 2 === 0 ? 500 : 600,
        paymentMethod: i % 2 === 0 ? 'CASH' : 'UPI',
        paymentStatus: 'PAID',
        visitId: visit.id,
        patientId: createdPatients[i].id,
        clinicId: clinic.id,
        receivedById: clinicAdmin.id,
      },
    });

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNo: `RX-TEST-${i + 100}`,
        diagnosis: i % 2 === 0 ? 'Viral fever' : 'Migraine',
        advice: i % 2 === 0 ? 'Take rest, drink plenty of water' : 'Avoid bright light, take prescribed medicines',
        visitId: visit.id,
        patientId: createdPatients[i].id,
        doctorId: i % 2 === 0 ? doctor1.id : doctor2.id,
        clinicId: clinic.id,
        medicines: {
          create: [
            { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: '3 times a day', duration: '5 days', instructions: 'After meals' },
            { name: i % 2 === 0 ? 'Vitamin C 500mg' : 'Sumatriptan 50mg', dosage: '1 tablet', frequency: 'Once daily', duration: '7 days', instructions: 'Morning after breakfast' },
          ],
        },
      },
    });

    await prisma.queueEntry.create({
      data: {
        tokenNumber: i + 1,
        status: 'COMPLETED',
        completedAt: new Date(yesterday.getTime() + (i + 1) * 3600000),
        visitId: visit.id,
        doctorId: i % 2 === 0 ? doctor1.id : doctor2.id,
        clinicId: clinic.id,
      },
    });
  }

  // Create today's active visits
  const activePatients = [5, 6, 7, 8, 9];
  for (let i = 0; i < activePatients.length; i++) {
    const status = i < 2 ? 'WAITING' : i < 3 ? 'IN_CONSULTATION' : 'COMPLETED';
    const visit = await prisma.visit.create({
      data: {
        patientId: createdPatients[activePatients[i]].id,
        doctorId: i % 2 === 0 ? doctor1.id : doctor3.id,
        clinicId: clinic.id,
        tokenNumber: i + 1,
        consultationType: 'GENERAL',
        status,
        symptoms: 'General checkup',
        createdAt: today,
        visitDate: today,
        createdById: clinicAdmin.id,
      },
    });

    await prisma.queueEntry.create({
      data: {
        tokenNumber: i + 1,
        status,
        calledAt: status === 'IN_CONSULTATION' ? today : undefined,
        completedAt: status === 'COMPLETED' ? today : undefined,
        visitId: visit.id,
        doctorId: i % 2 === 0 ? doctor1.id : doctor3.id,
        clinicId: clinic.id,
      },
    });

    if (status === 'COMPLETED') {
      await prisma.payment.create({
        data: {
          receiptNumber: `RCP-TEST-${i + 200}`,
          amount: 500,
          discount: 0,
          netAmount: 500,
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          visitId: visit.id,
          patientId: createdPatients[activePatients[i]].id,
          clinicId: clinic.id,
          receivedById: clinicAdmin.id,
        },
      });
    }
  }

  // Create visits for new patients (indices 10-19) with varied data
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const symptomsList = ['Chest pain and shortness of breath', 'Persistent headache for 2 weeks', 'Joint pain in knees', 'Skin rash with itching', 'Abdominal pain and bloating', 'Recurring fever with chills', 'Lower back pain', 'Dizziness and fatigue', 'Sore throat and congestion', 'Eye irritation and redness'];
  const diagnosesList = ['Hypertension', 'Tension headache', 'Osteoarthritis', 'Contact dermatitis', 'IBS', 'Malaria suspected', 'Lumbar spondylosis', 'Anemia', 'Tonsillitis', 'Conjunctivitis'];
  const adviceList = ['Reduce salt intake, monitor BP daily', 'Practice relaxation techniques', 'Avoid prolonged standing, use knee support', 'Avoid allergens, apply prescribed cream', 'Avoid spicy food, eat small meals', 'Complete blood work as advised', 'Do prescribed back exercises', 'Take iron supplements with vitamin C', 'Gargle with warm salt water', 'Use prescribed eye drops, avoid screen time'];

  for (let i = 10; i < 20; i++) {
    const idx = i - 10;
    for (let v = 0; v < 3; v++) {
      const visitDate = v === 0 ? weekAgo : v === 1 ? threeDaysAgo : yesterday;
      const status = v < 2 ? 'COMPLETED' : (i % 3 === 0 ? 'WAITING' : 'COMPLETED');
      const tokenBase = i * 10 + v;

      const visit = await prisma.visit.create({
        data: {
          patientId: createdPatients[i].id,
          doctorId: i % 3 === 0 ? doctor1.id : i % 3 === 1 ? doctor2.id : doctor3.id,
          clinicId: clinic.id,
          tokenNumber: tokenBase + 1,
          consultationType: v === 0 ? 'GENERAL' : v === 1 ? 'FOLLOW_UP' : 'GENERAL',
          status,
          symptoms: symptomsList[idx],
          diagnosis: diagnosesList[idx],
          vitals: JSON.stringify({ bloodPressure: `${120 + idx * 2}/${80 + idx}`, pulse: 70 + idx, temperature: 98.4 + (idx % 3) * 0.2, weight: 55 + idx * 2 }),
          visitDate,
          createdById: clinicAdmin.id,
        },
      });

      await prisma.payment.create({
        data: {
          receiptNumber: `RCP-CITY-${i}${v}${tokenBase}`,
          amount: 500 + idx * 50,
          discount: v === 1 ? 100 : 0,
          netAmount: v === 1 ? 400 + idx * 50 : 500 + idx * 50,
          paymentMethod: i % 2 === 0 ? 'CASH' : 'UPI',
          paymentStatus: 'PAID',
          visitId: visit.id,
          patientId: createdPatients[i].id,
          clinicId: clinic.id,
          receivedById: clinicAdmin.id,
        },
      });

      if (status === 'COMPLETED') {
        const prescription = await prisma.prescription.create({
          data: {
            prescriptionNo: `RX-CITY-${i}${v}${tokenBase}`,
            diagnosis: diagnosesList[idx],
            advice: adviceList[idx],
            nextVisitDate: v === 0 ? threeDaysAgo : null,
            visitId: visit.id,
            patientId: createdPatients[i].id,
            doctorId: i % 3 === 0 ? doctor1.id : i % 3 === 1 ? doctor2.id : doctor3.id,
            clinicId: clinic.id,
            medicines: {
              create: [
                { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: '3 times a day', duration: '5 days', instructions: 'After meals' },
                { name: idx % 2 === 0 ? 'Amoxicillin 250mg' : 'Ibuprofen 400mg', dosage: '1 capsule', frequency: '2 times a day', duration: '7 days', instructions: 'After food' },
                { name: 'Vitamin B-Complex', dosage: '1 tablet', frequency: 'Once daily', duration: '15 days', instructions: 'Morning' },
              ],
            },
          },
        });

        await prisma.queueEntry.create({
          data: {
            tokenNumber: tokenBase + 1,
            status: 'COMPLETED',
            completedAt: new Date(visitDate.getTime() + 3600000 * (v + 1)),
            visitId: visit.id,
            doctorId: i % 3 === 0 ? doctor1.id : i % 3 === 1 ? doctor2.id : doctor3.id,
            clinicId: clinic.id,
          },
        });
      }
    }
  }

  logger.info('Database seeded successfully!');
  logger.info('');
  logger.info('Login Credentials:');
  logger.info('====================');
  logger.info('Super Admin:    superadmin@clinic.com / admin123');
  logger.info('Clinic Admin:   admin@cityhealthcare.com / admin123');
  logger.info('Doctor 1:       rajesh.sharma@cityhealthcare.com / doctor123');
  logger.info('Doctor 2:       priya.singh@cityhealthcare.com / doctor123');
  logger.info('Doctor 3:       amit.kumar@cityhealthcare.com / doctor123');
  logger.info('Receptionist:   reception@cityhealthcare.com / reception123');
  logger.info('');
  logger.info(`Clinic 1: ${clinic.name} (ID: ${clinic.id})`);
  logger.info(`Clinic 2: ${clinic2.name} (ID: ${clinic2.id})`);
  logger.info(`Patients created: ${createdPatients.length} (Clinic 1: ${createdPatients.length} + Clinic 2: ${patientsClinic2.length})`);
  logger.info('Doctors created: 5');
  logger.info('Departments created: 7');
  logger.info('');
  logger.info('Clinic 2 Credentials:');
  logger.info('====================');
  logger.info('Clinic Admin:   admin@greenvalley.com / admin123');
  logger.info('Doctor 4:       sneha.patel@greenvalley.com / doctor123');
  logger.info('Doctor 5:       vijay.joshi@greenvalley.com / doctor123');
}

main()
  .catch((e) => {
    logger.error('Seed error', { error: e });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
