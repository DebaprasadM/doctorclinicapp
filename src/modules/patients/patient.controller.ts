import { Response, NextFunction } from 'express';
import { patientService } from './patient.service';
import { AuthRequest } from '../../types';
import { getClinicScope } from '../../utils/scope';
import { uploadToCloudinary, isConfigured } from '../../config/cloudinary';

export class PatientController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.create(req.body, getClinicScope(req.user));
      res.status(201).json({ success: true, message: 'Patient registered successfully', data: patient });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await patientService.findAll(getClinicScope(req.user), req.query as any);
      res.json({ success: true, message: 'Patients fetched successfully', ...result });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.findById(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Patient fetched successfully', data: patient });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const patient = await patientService.update(req.params.id, req.body, getClinicScope(req.user));
      res.json({ success: true, message: 'Patient updated successfully', data: patient });
    } catch (error) {
      next(error);
    }
  }

  async registerWithOPD(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await patientService.registerWithOPD(req.body, req.user!.userId, getClinicScope(req.user));
      res.status(201).json({ success: true, message: 'Patient registered with OPD visit', data: result });
    } catch (error) {
      next(error);
    }
  }

  async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const patients = await patientService.search(query, getClinicScope(req.user));
      res.json({ success: true, message: 'Search results', data: patients });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const history = await patientService.getPatientHistory(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Patient history fetched', data: history });
    } catch (error) {
      next(error);
    }
  }

  async uploadPhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No photo file provided' });
        return;
      }

      let url: string;
      if (isConfigured) {
        url = await uploadToCloudinary(req.file.buffer);
      } else {
        const fs = await import('fs');
        const path = await import('path');
        const uploadDir = path.join(__dirname, '../../../uploads/treatment-photos');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname);
        fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
        url = `/uploads/treatment-photos/${filename}`;
      }

      const photo = await patientService.addPhoto(req.params.id, url, req.body.caption, req.user!.userId);
      res.status(201).json({ success: true, message: 'Photo uploaded successfully', data: photo });
    } catch (error) {
      next(error);
    }
  }

  async getPhotos(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const photos = await patientService.getPhotos(req.params.id, getClinicScope(req.user));
      res.json({ success: true, message: 'Photos fetched successfully', data: photos });
    } catch (error) {
      next(error);
    }
  }

  async deletePhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await patientService.deletePhoto(req.params.photoId, getClinicScope(req.user));
      res.json({ success: true, message: 'Photo deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const patientController = new PatientController();
