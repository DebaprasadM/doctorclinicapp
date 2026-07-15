import { Response, NextFunction } from 'express';
import { AuthRequest, Role } from '../types';
import { AppError } from './errorHandler';
import prisma from '../config/database';

export function authorize(...allowedRoles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Access denied. Not authenticated.', 401);
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Access denied. Insufficient permissions.', 403);
    }
    next();
  };
}

export function authorizeClinicAdminDoctor(...allowedRoles: Role[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw new AppError('Access denied. Not authenticated.', 401);
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    if (req.user.role === 'DOCTOR') {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: req.user.userId },
        select: { isClinicAdmin: true },
      });
      if (doctor?.isClinicAdmin) {
        next();
        return;
      }
    }

    throw new AppError('Access denied. Insufficient permissions.', 403);
  };
}
