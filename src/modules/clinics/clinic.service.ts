import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../config/logger';
import { hashPassword } from '../../utils/password';

export class ClinicService {
  async create(data: any) {
    const clinic = await prisma.clinic.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        timezone: data.timezone || 'Asia/Kolkata',
      },
    });

    logger.info(`Clinic created: ${clinic.name} (${clinic.id})`);
    return clinic;
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, patients: true, doctors: true } },
        },
      }),
      prisma.clinic.count({ where }),
    ]);

    return {
      data: clinics,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, patients: true, doctors: true, visits: true, payments: true } },
      },
    });
    if (!clinic) throw new AppError('Clinic not found', 404);
    return clinic;
  }

  async update(id: string, data: any) {
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) throw new AppError('Clinic not found', 404);

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.timezone) updateData.timezone = data.timezone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.clinic.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) throw new AppError('Clinic not found', 404);

    // Soft delete by deactivating
    return prisma.clinic.update({ where: { id }, data: { isActive: false } });
  }

  async createAdmin(clinicId: string, data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) throw new AppError('Clinic not found', 404);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('User with this email already exists', 409);

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role: 'CLINIC_ADMIN',
        clinicId,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, clinicId: true },
    });

    logger.info(`Clinic admin created: ${user.email} for clinic ${clinicId}`);
    return user;
  }

  async getAdmins(clinicId: string) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) throw new AppError('Clinic not found', 404);

    return prisma.user.findMany({
      where: { clinicId, role: 'CLINIC_ADMIN' },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaff(clinicId: string, data: { email: string; password?: string; firstName: string; lastName: string; phone?: string; role?: string }) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) throw new AppError('Clinic not found', 404);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('User with this email already exists', 409);

    const allowedRoles = ['CLINIC_ADMIN', 'RECEPTIONIST'];
    const role = allowedRoles.includes(data.role || '') ? data.role as any : 'RECEPTIONIST';
    const password = data.password || 'staff123';
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role,
        clinicId,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, phone: true, isActive: true, clinicId: true, createdAt: true },
    });

    logger.info(`Staff created: ${user.email} (${role}) for clinic ${clinicId}`);
    return { user, defaultPassword: password };
  }

  async getStaff(clinicId: string) {
    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) throw new AppError('Clinic not found', 404);

    return prisma.user.findMany({
      where: { clinicId, role: { in: ['CLINIC_ADMIN', 'RECEPTIONIST'] } },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleStaffActive(userId: string, clinicId?: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, ...(clinicId ? { clinicId } : {}), role: { in: ['CLINIC_ADMIN', 'RECEPTIONIST'] } },
    });
    if (!user) throw new AppError('Staff not found', 404);

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
  }

  async deleteStaff(userId: string, clinicId?: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, ...(clinicId ? { clinicId } : {}), role: { in: ['CLINIC_ADMIN', 'RECEPTIONIST'] } },
    });
    if (!user) throw new AppError('Staff not found', 404);

    await prisma.user.delete({ where: { id: userId } });
    logger.info(`Staff deleted: ${user.email}`);
  }
}

export const clinicService = new ClinicService();
