import prisma from '../../config/database';
import { hashPassword } from '../../utils/password';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../config/logger';

export class DoctorService {
  async create(data: any, clinicId?: string) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const password = data.password || 'doctor123';
    if (!data.password) {
      logger.warn(`Default password used for doctor ${data.email}. Instruct user to change immediately.`);
    }
    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          role: 'DOCTOR',
          ...(clinicId ? { clinicId } : {}),
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialization: data.specialization,
          qualification: data.qualification,
          registrationNo: data.registrationNo,
          consultationFee: data.consultationFee,
          availableDays: data.availableDays ? JSON.stringify(data.availableDays) : null,
          availableSlots: data.availableSlots ? JSON.stringify(data.availableSlots) : null,
          bio: data.bio,
          isClinicAdmin: data.isClinicAdmin || false,
          ...(clinicId ? { clinicId } : {}),
        },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true } } },
      });

      return doctor;
    });

    logger.info(`Doctor created: ${data.email}`);
    return { ...result, defaultPassword: password };
  }

  async findAll(clinicId?: string, query: { page?: number; limit?: number; search?: string; isAvailable?: boolean } = {}) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (clinicId) where.clinicId = clinicId;
    
    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable;
    }

    if (query.search) {
      where.user = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, avatar: true },
          },
          _count: { select: { visits: true, prescriptions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.doctor.count({ where }),
    ]);

    return {
      data: doctors,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, clinicId?: string) {
    const doctor = await prisma.doctor.findFirst({
      where: { id, ...(clinicId ? { clinicId } : {}) },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, avatar: true, createdAt: true },
        },
        _count: { select: { visits: true, prescriptions: true } },
      },
    });

    if (!doctor) throw new AppError('Doctor not found', 404);
    return doctor;
  }

  async update(id: string, clinicId?: string, data: any = {}) {
    const doctor = await prisma.doctor.findFirst({ where: { id, ...(clinicId ? { clinicId } : {}) } });
    if (!doctor) throw new AppError('Doctor not found', 404);

    const updateData: any = {};
    const userUpdateData: any = {};

    if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
    if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;
    if (data.phone !== undefined) userUpdateData.phone = data.phone;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.qualification !== undefined) updateData.qualification = data.qualification;
    if (data.registrationNo !== undefined) updateData.registrationNo = data.registrationNo;
    if (data.consultationFee !== undefined) updateData.consultationFee = data.consultationFee;
    if (data.availableDays !== undefined) updateData.availableDays = JSON.stringify(data.availableDays);
    if (data.availableSlots !== undefined) updateData.availableSlots = JSON.stringify(data.availableSlots);
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.isClinicAdmin !== undefined) updateData.isClinicAdmin = data.isClinicAdmin;

    const result = await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({ where: { id: doctor.userId }, data: userUpdateData });
      }
      return tx.doctor.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true } },
        },
      });
    });

    return result;
  }

  async toggleActive(id: string, clinicId?: string) {
    const doctor = await prisma.doctor.findFirst({ where: { id, ...(clinicId ? { clinicId } : {}) } });
    if (!doctor) throw new AppError('Doctor not found', 404);

    const user = await prisma.user.findUnique({ where: { id: doctor.userId } });
    if (!user) throw new AppError('User not found', 404);

    return prisma.user.update({
      where: { id: user.id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true, firstName: true, lastName: true },
    });
  }

  async delete(id: string, clinicId?: string) {
    const doctor = await prisma.doctor.findFirst({ where: { id, ...(clinicId ? { clinicId } : {}) } });
    if (!doctor) throw new AppError('Doctor not found', 404);

    await prisma.$transaction(async (tx) => {
      await tx.doctor.delete({ where: { id } });
      await tx.user.delete({ where: { id: doctor.userId } });
    });

    logger.info(`Doctor deleted: ${id}`);
  }

  async getAvailableDoctors(clinicId?: string) {
    return prisma.doctor.findMany({
      where: { ...(clinicId ? { clinicId } : {}), isAvailable: true, user: { isActive: true } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async uploadSignature(id: string, clinicId: string | undefined, signatureUrl: string) {
    const doctor = await prisma.doctor.findFirst({ where: { id, ...(clinicId ? { clinicId } : {}) } });
    if (!doctor) throw new AppError('Doctor not found', 404);

    return prisma.doctor.update({
      where: { id },
      data: { signature: signatureUrl },
      select: { id: true, signature: true },
    });
  }
}

export const doctorService = new DoctorService();
