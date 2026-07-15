import { Router } from 'express';
import { visitController } from './visit.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/rbac';
import { createVisitSchema, updateVisitSchema, updateVisitStatusSchema } from './visit.validator';

const router = Router();

router.use(authenticate);

router.get('/today/stats', visitController.getTodayStats);
router.get('/doctor/:doctorId', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), visitController.getDoctorTodayVisits);
router.get('/', visitController.findAll);
router.get('/:id', visitController.findById);
router.post('/', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), validate(createVisitSchema), visitController.create);
router.put('/:id/status', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST'), validate(updateVisitStatusSchema), visitController.updateStatus);
router.put('/:id', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'DOCTOR'), validate(updateVisitSchema), visitController.update);

export default router;
