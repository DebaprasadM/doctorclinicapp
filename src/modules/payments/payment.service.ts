import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { generateReceiptNumber } from '../../utils/helpers';
import { logger } from '../../config/logger';

export class PaymentService {
  async create(data: any, clinicId?: string, userId?: string) {
    const visit = await prisma.visit.findFirst({ where: { id: data.visitId, ...(clinicId ? { clinicId } : {}) } });
    if (!visit) throw new AppError('Visit not found', 404);

    const existingPayment = await prisma.payment.findUnique({ where: { visitId: data.visitId } });
    if (existingPayment) throw new AppError('Payment already exists for this visit', 409);

    const netAmount = data.amount - (data.discount || 0);

    const payment = await prisma.payment.create({
      data: {
        receiptNumber: generateReceiptNumber(clinicId),
        amount: data.amount,
        discount: data.discount || 0,
        netAmount: netAmount > 0 ? netAmount : 0,
        paymentMethod: data.paymentMethod || 'CASH',
        paymentStatus: data.paymentStatus || 'PAID',
        referenceNo: data.referenceNo,
        notes: data.notes,
        visitId: data.visitId,
        patientId: visit.patientId,
        ...(clinicId ? { clinicId } : {}),
        receivedById: userId,
      } as any,
      include: {
        visit: { include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } }, patient: true } },
      },
    });

    logger.info(`Payment created: ${payment.receiptNumber}`);
    return payment;
  }

  async findAll(clinicId?: string, query?: { page?: number; limit?: number; paymentStatus?: string; paymentMethod?: string; startDate?: string; endDate?: string; search?: string }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (clinicId) where.clinicId = clinicId;

    if (query?.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query?.paymentMethod) where.paymentMethod = query.paymentMethod;

    if (query?.startDate || query?.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate + 'T23:59:59.999Z');
    }

    if (query?.search) {
      where.OR = [
        { receiptNumber: { contains: query.search, mode: 'insensitive' } },
        { patient: { OR: [{ firstName: { contains: query.search, mode: 'insensitive' } }, { lastName: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search } }] } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          patient: { select: { id: true, patientId: true, firstName: true, lastName: true, phone: true } },
          visit: { select: { id: true, tokenNumber: true, consultationType: true } },
          receivedBy: { select: { id: true, firstName: true, lastName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, clinicId?: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, ...(clinicId ? { clinicId } : {}) },
      include: {
        patient: true,
        visit: { include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } } } },
        receivedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    return payment;
  }

  async refund(id: string, clinicId?: string) {
    const payment = await prisma.payment.findFirst({ where: { id, ...(clinicId ? { clinicId } : {}), paymentStatus: 'PAID' } });
    if (!payment) throw new AppError('Paid payment not found', 404);

    return prisma.payment.update({
      where: { id },
      data: { paymentStatus: 'REFUNDED' },
    });
  }

  async getTodayCollection(clinicId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const payments = await prisma.payment.findMany({
      where: {
        ...(clinicId ? { clinicId } : {}),
        createdAt: { gte: today, lt: tomorrow },
        paymentStatus: 'PAID',
      },
    });

    const total = payments.reduce((sum, p) => sum + p.netAmount, 0);
    const byMethod = payments.reduce((acc: Record<string, number>, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + p.netAmount;
      return acc;
    }, {});

    return { total, count: payments.length, byMethod, payments };
  }
}

export const paymentService = new PaymentService();
