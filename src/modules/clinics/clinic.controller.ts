import { Response, NextFunction } from 'express';
import { clinicService } from './clinic.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class ClinicController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinic = await clinicService.create(req.body);
      res.status(201).json({ success: true, message: 'Clinic created successfully', data: clinic });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await clinicService.findAll(req.query as any);
      res.json({ success: true, message: 'Clinics fetched successfully', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinic = await clinicService.findById(req.params.id);
      res.json({ success: true, message: 'Clinic fetched successfully', data: clinic });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinic = await clinicService.update(req.params.id, req.body);
      res.json({ success: true, message: 'Clinic updated successfully', data: clinic });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinic = await clinicService.delete(req.params.id);
      res.json({ success: true, message: 'Clinic deactivated successfully', data: clinic });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await clinicService.createAdmin(req.params.id, req.body);
      res.status(201).json({ success: true, message: 'Clinic admin created successfully', data: user });
    } catch (error) {
      next(error);
    }
  }

  async getAdmins(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const admins = await clinicService.getAdmins(req.params.id);
      res.json({ success: true, message: 'Admins fetched successfully', data: admins });
    } catch (error) {
      next(error);
    }
  }

  async createStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await clinicService.createStaff(req.params.id, req.body);
      res.status(201).json({ success: true, message: 'Staff created successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  async getStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const staff = await clinicService.getStaff(req.params.id);
      res.json({ success: true, message: 'Staff fetched successfully', data: staff });
    } catch (error) {
      next(error);
    }
  }

  async toggleStaffActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await clinicService.toggleStaffActive(req.params.userId, getClinicScope(req.user));
      res.json({ success: true, message: 'Staff status updated', data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteStaff(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await clinicService.deleteStaff(req.params.userId, getClinicScope(req.user));
      res.json({ success: true, message: 'Staff deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const clinicController = new ClinicController();
