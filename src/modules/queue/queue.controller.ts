import { Response, NextFunction } from 'express';
import { queueService } from './queue.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class QueueController {
  async getDoctorQueue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.params.doctorId;
      const queue = await queueService.getDoctorQueue(doctorId, getClinicScope(req.user));
      res.json({ success: true, message: 'Queue fetched', data: queue });
    } catch (error) {
      next(error);
    }
  }

  async getClinicQueue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const queue = await queueService.getClinicQueue(getClinicScope(req.user));
      res.json({ success: true, message: 'Queue fetched', data: queue });
    } catch (error) {
      next(error);
    }
  }

  async callNextToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await queueService.callNextToken(req.params.doctorId, getClinicScope(req.user));
      res.json({ success: true, message: 'Next token called', data: result });
    } catch (error) {
      next(error);
    }
  }

  async markCompleted(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await queueService.markCompleted(req.params.visitId, getClinicScope(req.user));
      res.json({ success: true, message: 'Visit completed', data: result });
    } catch (error) {
      next(error);
    }
  }

  async skipPatient(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await queueService.skipPatient(req.params.visitId, getClinicScope(req.user));
      res.json({ success: true, message: 'Patient skipped', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getQueueStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctorId = req.query.doctorId as string | undefined;
      const stats = await queueService.getQueueStats(getClinicScope(req.user), doctorId);
      res.json({ success: true, message: 'Queue stats', data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export const queueController = new QueueController();
