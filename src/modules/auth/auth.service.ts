import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt';
import { JwtPayload } from '../../types';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../config/logger';

function formatUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    doctorId: user.doctor?.id || null,
    isClinicAdmin: user.doctor?.isClinicAdmin || false,
    clinicId: user.clinicId,
    isActive: user.isActive,
    ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt }),
    ...(user.createdAt && { createdAt: user.createdAt }),
  };
}

export class AuthService {
  async checkSessions(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { hasActiveSession: false, deviceCount: 0 };
    const count = await prisma.session.count({ where: { userId: user.id } });
    return { hasActiveSession: count > 0, deviceCount: count };
  }

  async login(email: string, password: string, userAgent?: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { doctor: true },
    });
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Contact administrator.', 403);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const payload: JwtPayload = {
      userId: user.id,
      clinicId: user.clinicId || undefined,
      role: user.role as JwtPayload['role'],
    };

    const tokens = generateTokenPair(payload);

    await prisma.session.deleteMany({ where: { userId: user.id } });

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        clinicId: user.clinicId,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: formatUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const payload: JwtPayload = {
        userId: decoded.userId,
        clinicId: decoded.clinicId,
        role: decoded.role,
      };

      const tokens = generateTokenPair(payload);

      await prisma.session.update({
        where: { id: session.id },
        data: { refreshToken: tokens.refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });

      return tokens;
    } catch {
      await prisma.session.delete({ where: { id: session.id } });
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async logout(refreshToken: string | null) {
    if (!refreshToken) {
      logger.warn('Logout attempted without refresh token');
      return;
    }
    await prisma.session.deleteMany({ where: { refreshToken } });
    logger.info('User logged out');
  }

  async switchClinic(userId: string, clinicId?: string, userAgent?: string, ipAddress?: string) {
    if (clinicId) {
      const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
      if (!clinic || !clinic.isActive) {
        throw new AppError('Clinic not found or inactive', 404);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { doctor: true },
    });
    if (!user) throw new AppError('User not found', 404);

    const payload: JwtPayload = {
      userId: user.id,
      clinicId: clinicId || undefined,
      role: user.role as JwtPayload['role'],
    };

    const tokens = generateTokenPair(payload);

    await prisma.session.deleteMany({ where: { userId } });
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        clinicId: clinicId || null,
      },
    });

    logger.info(`User ${user.email} switched to clinic: ${clinicId || 'none (super admin)'}`);

    return {
      user: { ...formatUser(user), clinicId: clinicId || null },
      ...tokens,
    };
  }

  async logoutFromAllDevices(userId: string) {
    await prisma.session.deleteMany({ where: { userId } });
    logger.info('User logged out from all devices');
  }

  async getProfile(userId: string, jwtClinicId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        clinicId: true,
        createdAt: true,
        doctor: {
          select: {
            id: true,
            specialization: true,
            qualification: true,
            consultationFee: true,
            isAvailable: true,
            isClinicAdmin: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const formatted = formatUser(user);
    if (user.role === 'SUPER_ADMIN' && jwtClinicId) {
      formatted.clinicId = jwtClinicId;
    }
    return formatted;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const isValid = await comparePassword(currentPassword, user.password);
    if (!isValid) throw new AppError('Current password is incorrect', 400);

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await prisma.session.deleteMany({ where: { userId } });
  }
}

export const authService = new AuthService();
