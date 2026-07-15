import { Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class ReportController {
  async getRevenueReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportService.getRevenueReport(getClinicScope(req.user), startDate, endDate);
      res.json({ success: true, message: 'Revenue report', data });
    } catch (error) {
      next(error);
    }
  }

  async getDoctorRevenueReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportService.getDoctorRevenueReport(getClinicScope(req.user), startDate, endDate);
      res.json({ success: true, message: 'Doctor revenue report', data });
    } catch (error) {
      next(error);
    }
  }

  async getPatientReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportService.getPatientReport(getClinicScope(req.user), startDate, endDate);
      res.json({ success: true, message: 'Patient report', data });
    } catch (error) {
      next(error);
    }
  }

  async getVisitReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query as any;
      const data = await reportService.getVisitReport(getClinicScope(req.user), startDate, endDate);
      res.json({ success: true, message: 'Visit report', data });
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
