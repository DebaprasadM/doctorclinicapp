import { Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinicId = getClinicScope(req.user);
      if (req.user?.role === 'SUPER_ADMIN' && !clinicId) {
        const data = await dashboardService.getSuperAdminStats();
        return res.json({ success: true, message: 'Dashboard data fetched', data });
      }
      const data = await dashboardService.getDashboardStats(clinicId);
      res.json({ success: true, message: 'Dashboard data fetched', data });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
