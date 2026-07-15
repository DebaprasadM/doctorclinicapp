import { Response, NextFunction } from 'express';
import { settingService } from './setting.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';

export class SettingController {
  async getClinicInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinic = await settingService.getClinicInfo(getClinicScope(req.user));
      res.json({ success: true, message: 'Clinic info fetched', data: clinic });
    } catch (error) {
      next(error);
    }
  }

  async updateClinicInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const clinic = await settingService.updateClinicInfo(getClinicScope(req.user), req.body);
      res.json({ success: true, message: 'Clinic info updated', data: clinic });
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.getClinicSettings(getClinicScope(req.user));
      res.json({ success: true, message: 'Settings fetched', data: settings });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await settingService.updateBulkSettings(getClinicScope(req.user), req.body);
      res.json({ success: true, message: 'Settings updated', data: settings });
    } catch (error) {
      next(error);
    }
  }

  async getWhatsAppConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const config = await settingService.getWhatsAppConfig(getClinicScope(req.user));
      res.json({ success: true, message: 'WhatsApp config fetched', data: config });
    } catch (error) {
      next(error);
    }
  }

  async updateWhatsAppConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const config = await settingService.updateWhatsAppConfig(getClinicScope(req.user), req.body);
      res.json({ success: true, message: 'WhatsApp config updated', data: config });
    } catch (error) {
      next(error);
    }
  }

  async getPrescriptionTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const template = await settingService.getPrescriptionTemplate(getClinicScope(req.user));
      res.json({ success: true, message: 'Template fetched', data: template });
    } catch (error) {
      next(error);
    }
  }

  async updatePrescriptionTemplate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const template = await settingService.updatePrescriptionTemplate(getClinicScope(req.user), req.body);
      res.json({ success: true, message: 'Template updated', data: template });
    } catch (error) {
      next(error);
    }
  }

  async getConsultationFees(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fees = await settingService.getConsultationFees(getClinicScope(req.user));
      res.json({ success: true, message: 'Fees fetched', data: fees });
    } catch (error) {
      next(error);
    }
  }

  async updateConsultationFees(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fees = await settingService.updateConsultationFees(getClinicScope(req.user), req.body);
      res.json({ success: true, message: 'Fees updated', data: fees });
    } catch (error) {
      next(error);
    }
  }

  async getDepartments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const departments = await settingService.getDepartments(getClinicScope(req.user));
      res.json({ success: true, message: 'Departments fetched', data: departments });
    } catch (error) {
      next(error);
    }
  }

  async createDepartment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const department = await settingService.createDepartment(getClinicScope(req.user), req.body);
      res.status(201).json({ success: true, message: 'Department created', data: department });
    } catch (error) {
      next(error);
    }
  }
}

export const settingController = new SettingController();
