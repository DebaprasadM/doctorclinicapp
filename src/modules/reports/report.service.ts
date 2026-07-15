import prisma from '../../config/database';

export class ReportService {
  async getRevenueReport(clinicId?: string, startDate?: string, endDate?: string) {
    const where: any = { ...(clinicId ? { clinicId } : {}), paymentStatus: 'PAID' };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        patient: { select: { firstName: true, lastName: true, patientId: true } },
        visit: { select: { tokenNumber: true, consultationType: true } },
        receivedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.netAmount, 0);
    const byMethod = payments.reduce((acc: Record<string, number>, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.netAmount;
      return acc;
    }, {});

    return { totalRevenue, count: payments.length, byMethod, payments };
  }

  async getDoctorRevenueReport(clinicId?: string, startDate?: string, endDate?: string) {
    const where: any = { ...(clinicId ? { clinicId } : {}), paymentStatus: 'PAID' };
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate + 'T23:59:59.999Z') };

    const payments = await prisma.payment.findMany({
      where,
      include: {
        visit: { include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } } } },
      },
    });

    const doctorMap = new Map<string, { name: string; count: number; revenue: number }>();
    
    for (const p of payments) {
      const doctorId = p.visit?.doctorId || 'unknown';
      const existing = doctorMap.get(doctorId) || { name: 'Unknown', count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += p.netAmount;
      if (p.visit?.doctor?.user) {
        existing.name = `Dr. ${p.visit.doctor.user.firstName} ${p.visit.doctor.user.lastName}`;
      }
      doctorMap.set(doctorId, existing);
    }

    return Array.from(doctorMap.entries()).map(([id, data]) => ({ id, ...data }));
  }

  async getPatientReport(clinicId?: string, startDate?: string, endDate?: string) {
    const where: any = {}; if (clinicId) where.clinicId = clinicId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const patients = await prisma.patient.findMany({
      where,
      include: {
        _count: { select: { visits: true, payments: true, prescriptions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return patients;
  }

  async getVisitReport(clinicId?: string, startDate?: string, endDate?: string) {
    const where: any = {}; if (clinicId) where.clinicId = clinicId;
    if (startDate || endDate) {
      where.visitDate = {};
      if (startDate) where.visitDate.gte = new Date(startDate);
      if (endDate) where.visitDate.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        patient: { select: { firstName: true, lastName: true, patientId: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        payment: true,
      },
      orderBy: { visitDate: 'desc' },
    });

    const byStatus = visits.reduce((acc: Record<string, number>, v) => {
      acc[v.status] = (acc[v.status] || 0) + 1;
      return acc;
    }, {});

    const byType = visits.reduce((acc: Record<string, number>, v) => {
      acc[v.consultationType] = (acc[v.consultationType] || 0) + 1;
      return acc;
    }, {});

    return { total: visits.length, byStatus, byType, visits };
  }

  async getPaymentReport(clinicId?: string, startDate?: string, endDate?: string) {
    return this.getRevenueReport(clinicId, startDate, endDate);
  }
}

export const reportService = new ReportService();
