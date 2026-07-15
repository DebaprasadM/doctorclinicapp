import { Response, NextFunction } from 'express';
import { doctorService } from './doctor.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class DoctorController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctor = await doctorService.create(req.body, getClinicScope(req.user));
      res.status(201).json({ success: true, message: 'Doctor created successfully', data: doctor });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await doctorService.findAll(getClinicScope(req.user), req.query as any);
      res.json({ success: true, message: 'Doctors fetched successfully', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctor = await doctorService.findById(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Doctor fetched successfully', data: doctor });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctor = await doctorService.update(req.params.id, getClinicScope(req.user), req.body);
      res.json({ success: true, message: 'Doctor updated successfully', data: doctor });
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await doctorService.toggleActive(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: `Doctor ${result.isActive ? 'activated' : 'deactivated'} successfully`, data: result });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await doctorService.delete(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Doctor deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getAvailable(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doctors = await doctorService.getAvailableDoctors(getClinicScope(req.user));
      res.json({ success: true, message: 'Available doctors fetched', data: doctors });
    } catch (error) {
      next(error);
    }
  }

  async uploadSignature(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new Error('No file uploaded');
      const { uploadToCloudinary } = await import('../../config/cloudinary');
      const signatureUrl = await uploadToCloudinary(req.file.buffer, 'doctor-signatures');
      const result = await doctorService.uploadSignature(req.params.id, getClinicScope(req.user), signatureUrl);
      res.json({ success: true, message: 'Signature uploaded successfully', data: result });
    } catch (error) {
      next(error);
    }
  }
}

export const doctorController = new DoctorController();
