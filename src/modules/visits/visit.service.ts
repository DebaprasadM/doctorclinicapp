import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { generateReceiptNumber } from '../../utils/helpers';
import { logger } from '../../config/logger';

export class VisitService {
  async create(data: any, clinicId: string | undefined, userId: string) {
    // Verify patient exists in clinic
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, ...(clinicId ? { clinicId } : {}) },
    });
    if (!patient) throw new AppError('Patient not found', 404);

    // Verify doctor exists in clinic
    const doctor = await prisma.doctor.findFirst({
      where: { id: data.doctorId, ...(clinicId ? { clinicId } : {}), isAvailable: true },
    });
    if (!doctor) throw new AppError('Doctor not available or not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const consultationFee = doctor.consultationFee;
    const paymentData = data.payment;

    const result = await prisma.$transaction(async (tx) => {
      // Token count inside transaction to prevent race conditions
      const todayVisitCount = await tx.visit.count({
        where: { doctorId: data.doctorId, ...(clinicId ? { clinicId } : {}), visitDate: { gte: today, lt: tomorrow } },
      });
      const tokenNumber = todayVisitCount + 1;
      // Create visit
      const visit = await tx.visit.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          ...(clinicId ? { clinicId } : ({} as any)),
          tokenNumber,
          consultationType: data.consultationType || 'GENERAL',
          status: 'WAITING',
          symptoms: data.symptoms,
          vitals: data.vitals ? JSON.stringify(data.vitals) : null,
          createdById: userId,
        },
        include: {
          patient: true,
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      });

      // Create queue entry
      await tx.queueEntry.create({
        data: {
          tokenNumber,
          status: 'WAITING',
          visitId: visit.id,
          doctorId: data.doctorId,
          ...(clinicId ? { clinicId } : ({} as any)),
        },
      });

      // Create payment if provided
      if (paymentData && paymentData.amount > 0) {
        const netAmount = paymentData.amount - (paymentData.discount || 0);
        await tx.payment.create({
          data: {
            receiptNumber: generateReceiptNumber(clinicId),
            amount: paymentData.amount,
            discount: paymentData.discount || 0,
            netAmount: netAmount > 0 ? netAmount : 0,
            paymentMethod: paymentData.paymentMethod || 'CASH',
            paymentStatus: paymentData.paymentStatus || 'PAID',
            referenceNo: paymentData.referenceNo,
            notes: paymentData.notes,
            visitId: visit.id,
            patientId: data.patientId,
            ...(clinicId ? { clinicId } : ({} as any)),
            receivedById: userId,
          },
        });
      }

      return visit;
    });

    logger.info(`Visit created: Token #${result.tokenNumber} for Dr. ${result.doctor.user.firstName}`);
    return result;
  }

  async findAll(clinicId: string | undefined, query: { page?: number; limit?: number; status?: string; doctorId?: string; dateFrom?: string; dateTo?: string; search?: string; hasPrescription?: string; paymentStatus?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (clinicId) where.clinicId = clinicId;

    if (query.status) where.status = query.status;
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.hasPrescription === 'true') where.prescription = { isNot: null };
    if (query.hasPrescription === 'false') where.prescription = null;
    if (query.paymentStatus) where.payment = { paymentStatus: query.paymentStatus };
    
    if (query.dateFrom || query.dateTo) {
      const dateFilter: any = {};
      if (query.dateFrom) {
        const from = new Date(query.dateFrom);
        from.setHours(0, 0, 0, 0);
        dateFilter.gte = from;
      }
      if (query.dateTo) {
        const to = new Date(query.dateTo);
        to.setHours(23, 59, 59, 999);
        dateFilter.lte = to;
      }
      where.visitDate = dateFilter;
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      where.visitDate = { gte: today, lt: tomorrow };
    }

    if (query.search) {
      where.patient = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
          { patientId: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [visits, total] = await Promise.all([
      prisma.visit.findMany({
        where,
        include: {
          patient: true,
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          payment: true,
          prescription: { select: { id: true, prescriptionNo: true } },
        },
        skip,
        take: limit,
        orderBy: { tokenNumber: 'asc' },
      }),
      prisma.visit.count({ where }),
    ]);

    return {
      data: visits,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, clinicId?: string) {
    const visit = await prisma.visit.findFirst({
      where: { id, ...(clinicId ? { clinicId } : {}) },
      include: {
        patient: true,
        doctor: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        payment: true,
        prescription: { include: { medicines: true } },
      },
    });

    if (!visit) throw new AppError('Visit not found', 404);
    return visit;
  }

  async updateStatus(id: string, clinicId: string | undefined, status: string) {
    const visit = await prisma.visit.findFirst({ where: { id, ...(clinicId ? { clinicId } : {}) } });
    if (!visit) throw new AppError('Visit not found', 404);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.visit.update({
        where: { id },
        data: { status },
      });

      await tx.queueEntry.update({
        where: { visitId: id },
        data: {
          status,
          calledAt: status === 'IN_CONSULTATION' ? new Date() : undefined,
          completedAt: status === 'COMPLETED' ? new Date() : undefined,
        },
      });

      return updated;
    });
  }

  async update(id: string, clinicId: string | undefined, data: any) {
    const visit = await prisma.visit.findFirst({ where: { id, ...(clinicId ? { clinicId } : {}) } });
    if (!visit) throw new AppError('Visit not found', 404);

    const updateData: any = {};
    if (data.symptoms !== undefined) updateData.symptoms = data.symptoms;
    if (data.vitals !== undefined) updateData.vitals = typeof data.vitals === 'string' ? data.vitals : JSON.stringify(data.vitals);
    if (data.diagnosis !== undefined) updateData.diagnosis = data.diagnosis;
    if (data.clinicalNotes !== undefined) updateData.clinicalNotes = data.clinicalNotes;
    if (data.consultationType !== undefined) updateData.consultationType = data.consultationType;

    return prisma.visit.update({ where: { id }, data: updateData });
  }

  async getTodayStats(clinicId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, waiting, inConsultation, completed, skipped] = await Promise.all([
      prisma.visit.count({ where: { ...(clinicId ? { clinicId } : {}), visitDate: { gte: today, lt: tomorrow } } }),
      prisma.visit.count({ where: { ...(clinicId ? { clinicId } : {}), visitDate: { gte: today, lt: tomorrow }, status: 'WAITING' } }),
      prisma.visit.count({ where: { ...(clinicId ? { clinicId } : {}), visitDate: { gte: today, lt: tomorrow }, status: 'IN_CONSULTATION' } }),
      prisma.visit.count({ where: { ...(clinicId ? { clinicId } : {}), visitDate: { gte: today, lt: tomorrow }, status: 'COMPLETED' } }),
      prisma.visit.count({ where: { ...(clinicId ? { clinicId } : {}), visitDate: { gte: today, lt: tomorrow }, status: 'SKIPPED' } }),
    ]);

    return { total, waiting, inConsultation, completed, skipped };
  }

  async getDoctorTodayVisits(doctorId: string, clinicId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const visits = await prisma.visit.findMany({
      where: {
        doctorId,
        ...(clinicId ? { clinicId } : {}),
        visitDate: { gte: today, lt: tomorrow },
      },
      include: {
        patient: true,
        payment: true,
        prescription: { include: { medicines: true } },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    return visits;
  }
}

export const visitService = new VisitService();
