import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../middlewares/auth';
import { authorizeClinicAdminDoctor } from '../../middlewares/rbac';

const router = Router();

router.use(authenticate);
router.use(authorizeClinicAdminDoctor('SUPER_ADMIN', 'CLINIC_ADMIN'));

router.get('/revenue', reportController.getRevenueReport);
router.get('/doctor-revenue', reportController.getDoctorRevenueReport);
router.get('/patients', reportController.getPatientReport);
router.get('/visits', reportController.getVisitReport);

export default router;
