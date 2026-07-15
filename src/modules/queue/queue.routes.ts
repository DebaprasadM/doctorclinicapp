import { Router } from 'express';
import { queueController } from './queue.controller';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/rbac';

const router = Router();

router.use(authenticate);

router.get('/clinic', queueController.getClinicQueue);
router.get('/stats', queueController.getQueueStats);
router.get('/doctor/:doctorId', queueController.getDoctorQueue);
router.post('/doctor/:doctorId/call-next', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), queueController.callNextToken);
router.post('/visit/:visitId/complete', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), queueController.markCompleted);
router.post('/visit/:visitId/skip', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), queueController.skipPatient);

export default router;
