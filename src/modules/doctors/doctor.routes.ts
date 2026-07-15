import { Router } from 'express';
import { doctorController } from './doctor.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authorize, authorizeClinicAdminDoctor } from '../../middlewares/rbac';
import { createDoctorSchema, updateDoctorSchema } from './doctor.validator';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.use(authenticate);

router.get('/available', doctorController.getAvailable);
router.get('/', authorizeClinicAdminDoctor('SUPER_ADMIN', 'CLINIC_ADMIN', 'RECEPTIONIST'), doctorController.findAll);
router.get('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), doctorController.findById);
router.post('/', authorize('SUPER_ADMIN'), validate(createDoctorSchema), doctorController.create);
router.put('/:id', authorizeClinicAdminDoctor('SUPER_ADMIN', 'CLINIC_ADMIN'), validate(updateDoctorSchema), doctorController.update);
router.put('/:id/signature', authorizeClinicAdminDoctor('SUPER_ADMIN', 'CLINIC_ADMIN'), upload.single('signature'), doctorController.uploadSignature);
router.patch('/:id/toggle-active', authorizeClinicAdminDoctor('SUPER_ADMIN', 'CLINIC_ADMIN'), doctorController.toggleActive);
router.delete('/:id', authorize('SUPER_ADMIN'), doctorController.delete);

export default router;
