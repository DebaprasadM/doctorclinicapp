import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { generatePrescriptionNumber } from '../../utils/helpers';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

export class PrescriptionService {
  async create(data: any, userId: string, clinicId?: string) {
    const visit = await prisma.visit.findFirst({
      where: { id: data.visitId, ...(clinicId ? { clinicId } : {}) },
      include: { patient: true, doctor: { include: { user: true } } },
    });
    if (!visit) throw new AppError('Visit not found', 404);

    const existingPrescription = await prisma.prescription.findUnique({ where: { visitId: data.visitId } });
    if (existingPrescription) throw new AppError('Prescription already exists for this visit', 409);

    const doctor = await prisma.doctor.findFirst({ where: { userId, ...(clinicId ? { clinicId } : {}) } });
    if (!doctor) throw new AppError('Doctor profile not found', 404);

    const prescriptionNo = generatePrescriptionNumber(clinicId);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(env.PRESCRIPTION_EXPIRY_DAYS));

    const result = await prisma.$transaction(async (tx) => {
      const createData: any = {
        prescriptionNo,
        diagnosis: data.diagnosis,
        clinicalNotes: data.clinicalNotes,
        investigations: data.investigations,
        advice: data.advice,
        nextVisitDate: data.nextVisitDate ? new Date(data.nextVisitDate) : null,
        expiryDate,
        visitId: data.visitId,
        patientId: visit.patientId,
        doctorId: doctor.id,
        medicines: {
          create: data.medicines.map((m: any) => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
            route: m.route,
          })),
        },
      };
      if (clinicId) createData.clinicId = clinicId;

      const prescription = await tx.prescription.create({
        data: createData,
        include: {
          medicines: true,
          patient: true,
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          visit: true,
        },
      });

      // Update visit status to COMPLETED
      await tx.visit.update({
        where: { id: data.visitId },
        data: { status: 'COMPLETED' },
      });

      // Sync queue entry status
      await tx.queueEntry.update({
        where: { visitId: data.visitId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      return prescription;
    });

    logger.info(`Prescription created: ${result.prescriptionNo}`);
    return result;
  }

  async findAll(query: { page?: number; limit?: number; patientId?: string; doctorId?: string; search?: string }, clinicId?: string) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (clinicId) where.clinicId = clinicId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.search) {
      where.OR = [
        { prescriptionNo: { contains: query.search, mode: 'insensitive' } },
        { patient: { OR: [{ firstName: { contains: query.search, mode: 'insensitive' } }, { lastName: { contains: query.search, mode: 'insensitive' } }] } },
      ];
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where,
        include: {
          patient: { select: { id: true, patientId: true, firstName: true, lastName: true, phone: true, whatsappNumber: true } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          medicines: true,
          visit: { select: { id: true, tokenNumber: true, visitDate: true, consultationType: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where }),
    ]);

    return {
      data: prescriptions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, clinicId?: string) {
    const prescription = await prisma.prescription.findFirst({
      where: { id, ...(clinicId ? { clinicId } : {}) },
      include: {
        patient: true,
        doctor: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        medicines: true,
        visit: { include: { payment: true } },
      },
    });
    if (!prescription) throw new AppError('Prescription not found', 404);
    return prescription;
  }

  async findByPrescriptionNo(prescriptionNo: string) {
    const prescription = await prisma.prescription.findUnique({
      where: { prescriptionNo },
      include: {
        patient: true,
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        medicines: true,
        visit: true,
        clinic: true,
      },
    });
    if (!prescription) throw new AppError('Prescription not found', 404);

    // Check expiry
    if (prescription.expiryDate && prescription.expiryDate < new Date()) {
      throw new AppError('Prescription link has expired', 410);
    }

    // Fetch prescription template setting
    const settings = await prisma.clinicSetting.findMany({
      where: { clinicId: prescription.clinicId },
    });
    const templateSetting = settings.find(s => s.key === 'prescriptionTemplate');
    let prescriptionTemplate = {
      templateId: 'classic',
      showLogo: true,
      showDoctorSignature: true,
      showQRCode: true,
      headerColor: '#1a365d',
      fontSize: 'normal',
    };
    if (templateSetting) {
      try { prescriptionTemplate = { ...prescriptionTemplate, ...JSON.parse(templateSetting.value) }; } catch {}
    }

    return { ...prescription, prescriptionTemplate };
  }
}

export const prescriptionService = new PrescriptionService();
