import { Router } from 'express';
import { prescriptionController } from './prescription.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/rbac';
import { createPrescriptionSchema } from './prescription.validator';

const router = Router();

// Public routes (no auth required - for sharing)
router.get('/public/:prescriptionNo', prescriptionController.getPublicPrescription);

// Protected routes
router.use(authenticate);

router.get('/', prescriptionController.findAll);
router.get('/:id', prescriptionController.findById);
router.post('/', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR'), validate(createPrescriptionSchema), prescriptionController.create);

export default router;
