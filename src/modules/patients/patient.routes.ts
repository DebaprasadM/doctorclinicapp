import { Router } from 'express';
import { patientController } from './patient.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/rbac';
import { createPatientSchema, updatePatientSchema, registerWithOPDSchema } from './patient.validator';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router = Router();

router.use(authenticate);

router.post('/register-opd', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), validate(registerWithOPDSchema), patientController.registerWithOPD);
router.get('/search', patientController.search);
router.get('/:id/history', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), patientController.getHistory);
router.get('/', patientController.findAll);
router.get('/:id', patientController.findById);
router.post('/', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), validate(createPatientSchema), patientController.create);
router.put('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), validate(updatePatientSchema), patientController.update);
router.get('/:id/photos', patientController.getPhotos);
router.post('/:id/photos', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), upload.single('photo'), patientController.uploadPhoto);
router.delete('/photos/:photoId', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR'), patientController.deletePhoto);

export default router;
