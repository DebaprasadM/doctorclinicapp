import { Response, NextFunction } from 'express';
import { prescriptionService } from './prescription.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class PrescriptionController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prescription = await prescriptionService.create(req.body, req.user!.userId, getClinicScope(req.user));
      res.status(201).json({ success: true, message: 'Prescription created successfully', data: prescription });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await prescriptionService.findAll(req.query as any, getClinicScope(req.user));
      res.json({ success: true, message: 'Prescriptions fetched successfully', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prescription = await prescriptionService.findById(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Prescription fetched successfully', data: prescription });
    } catch (error) {
      next(error);
    }
  }

  async getPublicPrescription(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const prescription = await prescriptionService.findByPrescriptionNo(req.params.prescriptionNo);
      res.json({ success: true, message: 'Prescription fetched successfully', data: prescription });
    } catch (error) {
      next(error);
    }
  }
}

export const prescriptionController = new PrescriptionController();
