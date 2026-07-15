import { Response, NextFunction } from 'express';
import { visitService } from './visit.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class VisitController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const visit = await visitService.create(req.body, getClinicScope(req.user), req.user!.userId);
      res.status(201).json({ success: true, message: 'Visit created successfully', data: visit });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await visitService.findAll(getClinicScope(req.user), req.query as any);
      res.json({ success: true, message: 'Visits fetched successfully', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const visit = await visitService.findById(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Visit fetched successfully', data: visit });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const visit = await visitService.updateStatus(req.params.id, getClinicScope(req.user), status);
      res.json({ success: true, message: 'Visit status updated', data: visit });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const visit = await visitService.update(req.params.id, getClinicScope(req.user), req.body);
      res.json({ success: true, message: 'Visit updated successfully', data: visit });
    } catch (error) {
      next(error);
    }
  }

  async getTodayStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await visitService.getTodayStats(getClinicScope(req.user));
      res.json({ success: true, message: 'Today stats fetched', data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getDoctorTodayVisits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.params.doctorId || req.user!.userId;
      // If user is a doctor, get their own visits
      const visits = await visitService.getDoctorTodayVisits(doctorId, getClinicScope(req.user));
      res.json({ success: true, message: 'Doctor visits fetched', data: visits });
    } catch (error) {
      next(error);
    }
  }
}

export const visitController = new VisitController();
