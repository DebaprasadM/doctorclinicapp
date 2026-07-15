import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export class QueueService {
  async getDoctorQueue(doctorId: string, clinicId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queueEntries = await prisma.queueEntry.findMany({
      where: {
        doctorId,
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: today, lt: tomorrow },
        status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
      },
      include: {
        visit: {
          include: {
            patient: { select: { id: true, patientId: true, firstName: true, lastName: true, phone: true, gender: true, age: true } },
          },
        },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    return queueEntries;
  }

  async getClinicQueue(clinicId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await prisma.queueEntry.findMany({
      where: {
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: today, lt: tomorrow },
      },
      include: {
        visit: {
          include: {
            patient: { select: { id: true, patientId: true, firstName: true, lastName: true, phone: true } },
          },
        },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: [{ doctorId: 'asc' }, { tokenNumber: 'asc' }],
    });

    return queue;
  }

  async callNextToken(doctorId: string, clinicId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find next waiting patient
    const nextEntry = await prisma.queueEntry.findFirst({
      where: {
        doctorId,
        ...(clinicId ? { clinicId } : {}),
        status: 'WAITING',
        createdAt: { gte: today, lt: tomorrow },
      },
      orderBy: { tokenNumber: 'asc' },
    });

    if (!nextEntry) {
      throw new AppError('No patients in queue', 404);
    }

    return prisma.$transaction(async (tx) => {
      // Mark all current IN_CONSULTATION as WAITING or COMPLETED
      await tx.queueEntry.updateMany({
        where: { doctorId, ...(clinicId ? { clinicId } : {}), status: 'CALLED' },
        data: { status: 'WAITING' },
      });

      // Call next
      const updated = await tx.queueEntry.update({
        where: { id: nextEntry.id },
        data: { status: 'CALLED', calledAt: new Date() },
        include: {
          visit: {
            include: {
              patient: { select: { id: true, patientId: true, firstName: true, lastName: true, phone: true } },
            },
          },
        },
      });

      await tx.visit.update({
        where: { id: nextEntry.visitId },
        data: { status: 'IN_CONSULTATION' },
      });

      return updated;
    });
  }

  async markCompleted(visitId: string, clinicId?: string) {
    return prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findFirst({ where: { id: visitId, ...(clinicId ? { clinicId } : {}) } });
      if (!visit) throw new AppError('Visit not found', 404);

      const entry = await tx.queueEntry.update({
        where: { visitId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      await tx.visit.update({
        where: { id: visitId },
        data: { status: 'COMPLETED' },
      });

      return entry;
    });
  }

  async skipPatient(visitId: string, clinicId?: string) {
    return prisma.$transaction(async (tx) => {
      const visit = await tx.visit.findFirst({ where: { id: visitId, ...(clinicId ? { clinicId } : {}) } });
      if (!visit) throw new AppError('Visit not found', 404);

      const entry = await tx.queueEntry.update({
        where: { visitId },
        data: { status: 'SKIPPED' },
      });

      await tx.visit.update({
        where: { id: visitId },
        data: { status: 'SKIPPED' },
      });

      return entry;
    });
  }

  async getQueueStats(clinicId?: string, doctorId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      ...(clinicId ? { clinicId } : {}),
      createdAt: { gte: today, lt: tomorrow },
    };
    if (doctorId) where.doctorId = doctorId;

    const [waiting, called, inConsultation, completed, skipped] = await Promise.all([
      prisma.queueEntry.count({ where: { ...where, status: 'WAITING' } }),
      prisma.queueEntry.count({ where: { ...where, status: 'CALLED' } }),
      prisma.queueEntry.count({ where: { ...where, status: 'IN_CONSULTATION' } }),
      prisma.queueEntry.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.queueEntry.count({ where: { ...where, status: 'SKIPPED' } }),
    ]);

    return { waiting, called, inConsultation, completed, skipped, total: waiting + called + inConsultation + completed + skipped };
  }
}

export const queueService = new QueueService();
