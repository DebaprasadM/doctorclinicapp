import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { generatePatientId, generateReceiptNumber } from '../../utils/helpers';
import { logger } from '../../config/logger';
import { Prisma } from '@prisma/client';
import { deleteFromCloudinary, isConfigured } from '../../config/cloudinary';

export class PatientService {
  async create(data: any, clinicId?: string) {
    const patientId = generatePatientId(clinicId);
    
    const patient = await prisma.patient.create({
      data: {
        patientId,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        age: data.age || null,
        bloodGroup: data.bloodGroup,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        email: data.email || null,
        address: data.address,
        emergencyContact: data.emergencyContact,
        occupation: data.occupation,
        medicalNotes: data.medicalNotes,
        ...(clinicId ? { clinicId } : {}) as any,
      },
    });

    logger.info(`Patient created: ${patient.patientId}`);
    return patient;
  }

  async registerWithOPD(data: any, userId: string, clinicId?: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id: data.doctorId, isAvailable: true, ...(clinicId ? { clinicId } : {}) },
    });
    if (!doctor) throw new AppError('Doctor not available or not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const patientId = generatePatientId(clinicId);

          const todayVisits = await tx.visit.count({
            where: { doctorId: data.doctorId, visitDate: { gte: today, lt: tomorrow }, ...(clinicId ? { clinicId } : {}) as any },
          });
          const tokenNumber = todayVisits + 1;

          const patient = await tx.patient.create({
            data: {
              patientId,
              firstName: data.firstName,
              lastName: data.lastName,
              gender: data.gender,
              dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
              age: data.age || null,
              bloodGroup: data.bloodGroup,
              phone: data.phone,
              whatsappNumber: data.whatsappNumber,
              email: data.email || null,
              address: data.address,
              emergencyContact: data.emergencyContact,
              occupation: data.occupation,
              medicalNotes: data.medicalNotes,
              ...(clinicId ? { clinicId } : {}) as any,
            },
          });

          const visit = await tx.visit.create({
            data: {
              patientId: patient.id,
              doctorId: data.doctorId,
              ...(clinicId ? { clinicId } : {}) as any,
              tokenNumber,
              consultationType: data.consultationType || 'GENERAL',
              status: 'WAITING',
              symptoms: data.symptoms,
              vitals: data.vitals ? JSON.stringify(data.vitals) : null,
              createdById: userId,
            },
          });

          await tx.queueEntry.create({
            data: {
              tokenNumber,
              status: 'WAITING',
              visitId: visit.id,
              doctorId: data.doctorId,
              ...(clinicId ? { clinicId } : {}) as any,
            },
          });

          if (data.payment && data.payment.amount > 0) {
            const netAmount = data.payment.amount - (data.payment.discount || 0);
            await tx.payment.create({
              data: {
                receiptNumber: generateReceiptNumber(clinicId),
                amount: data.payment.amount,
                discount: data.payment.discount || 0,
                netAmount: netAmount > 0 ? netAmount : 0,
                paymentMethod: data.payment.paymentMethod || 'CASH',
                paymentStatus: data.payment.paymentStatus || 'PAID',
                visitId: visit.id,
                patientId: patient.id,
                ...(clinicId ? { clinicId } : {}) as any,
                receivedById: userId,
              },
            });
          }

          return { patient, visit, tokenNumber };
        });

        logger.info(`Patient registered with OPD visit: Token #${result.tokenNumber}`);
        return result;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          const target = (error.meta as any)?.target as string[] | undefined;
          if (target?.includes('firstName')) {
            throw new AppError(
              `Patient "${data.firstName} ${data.lastName}" with phone ${data.phone} already exists in this clinic`,
              409,
            );
          }
          logger.warn(`Token collision on attempt ${attempt + 1}, retrying...`, { meta: error.meta });
          if (attempt === maxRetries - 1) throw error;
          continue;
        }
        throw error;
      }
    }
  }

  async findAll(clinicId?: string, query: { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: string; dateFrom?: string; dateTo?: string } = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};
    if (clinicId) where.clinicId = clinicId;

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
      where.createdAt = dateFilter;
    }

    if (query.search) {
      where.OR = [
        { patientId: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { whatsappNumber: { contains: query.search } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { visits: true, prescriptions: true, payments: true } },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, clinicId?: string) {
    const patient = await prisma.patient.findFirst({
      where: { id, ...(clinicId ? { clinicId } : {}) },
      include: {
        _count: { select: { visits: true, prescriptions: true, payments: true } },
        visits: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
            payment: true,
          },
        },
      },
    });

    if (!patient) throw new AppError('Patient not found', 404);
    return patient;
  }

  async findByPatientId(patientId: string, clinicId?: string) {
    const patient = await prisma.patient.findFirst({
      where: { patientId, ...(clinicId ? { clinicId } : {}) },
    });
    if (!patient) throw new AppError('Patient not found', 404);
    return patient;
  }

  async update(id: string, data: any, clinicId?: string) {
    const patient = await prisma.patient.findFirst({ where: { id, ...(clinicId ? { clinicId } : {}) } });
    if (!patient) throw new AppError('Patient not found', 404);

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.age !== undefined) updateData.age = data.age;
    if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact;
    if (data.occupation !== undefined) updateData.occupation = data.occupation;
    if (data.medicalNotes !== undefined) updateData.medicalNotes = data.medicalNotes;

    return prisma.patient.update({ where: { id }, data: updateData });
  }

  async search(query: string, clinicId?: string) {
    const patients = await prisma.patient.findMany({
      where: {
        ...(clinicId ? { clinicId } : {}),
        OR: [
          { patientId: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { whatsappNumber: { contains: query } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return patients;
  }

  async addPhoto(patientId: string, url: string, caption: string | undefined, uploadedById: string) {
    return prisma.treatmentPhoto.create({
      data: { url, caption, patientId, uploadedById },
    });
  }

  async getPhotos(patientId: string, clinicId?: string) {
    return prisma.treatmentPhoto.findMany({
      where: { patient: { id: patientId, ...(clinicId ? { clinicId } : {}) } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePhoto(photoId: string, clinicId?: string) {
    const photo = await prisma.treatmentPhoto.findFirst({
      where: { id: photoId, ...(clinicId ? { patient: { clinicId } } : {}) },
    });
    if (!photo) throw new AppError('Photo not found', 404);

    if (photo.url.startsWith('http')) {
      if (isConfigured) {
        await deleteFromCloudinary(photo.url);
      }
    } else {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../../', photo.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.treatmentPhoto.delete({ where: { id: photoId } });
  }

  async getPatientHistory(patientId: string, clinicId?: string) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, ...(clinicId ? { clinicId } : {}) },
      include: {
        visits: {
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
            payment: true,
            prescription: {
              include: { medicines: true },
            },
          },
        },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          include: { medicines: true, doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
          take: 10,
        },
      },
    });

    if (!patient) throw new AppError('Patient not found', 404);
    return patient;
  }
}

export const patientService = new PatientService();
