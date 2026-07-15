import { Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class PaymentController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.create(req.body, getClinicScope(req.user), req.user!.userId);
      res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.findAll(getClinicScope(req.user), req.query as any);
      res.json({ success: true, message: 'Payments fetched successfully', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.findById(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Payment fetched successfully', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async refund(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.refund(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Payment refunded successfully', data: payment });
    } catch (error) {
      next(error);
    }
  }

  async getTodayCollection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const collection = await paymentService.getTodayCollection(getClinicScope(req.user));
      res.json({ success: true, message: 'Today collection fetched', data: collection });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
