import { Router } from 'express';
import { clinicController } from './clinic.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authorize, authorizeClinicAdminDoctor } from '../../middlewares/rbac';
import { createClinicSchema, updateClinicSchema, createAdminSchema, createStaffSchema } from './clinic.validator';

const router = Router();

router.use(authenticate);

// Clinic CRUD — SUPER_ADMIN only
router.get('/', authorize('SUPER_ADMIN'), clinicController.findAll);
router.post('/', authorize('SUPER_ADMIN'), validate(createClinicSchema), clinicController.create);
router.get('/:id', authorize('SUPER_ADMIN'), clinicController.findById);
router.put('/:id', authorize('SUPER_ADMIN'), validate(updateClinicSchema), clinicController.update);
router.delete('/:id', authorize('SUPER_ADMIN'), clinicController.delete);
router.get('/:id/admins', authorize('SUPER_ADMIN'), clinicController.getAdmins);
router.post('/:id/admins', authorize('SUPER_ADMIN'), validate(createAdminSchema), clinicController.createAdmin);

// Staff — SUPER_ADMIN + CLINIC_ADMIN
router.get('/:id/staff', authorizeClinicAdminDoctor('SUPER_ADMIN', 'CLINIC_ADMIN'), clinicController.getStaff);
router.post('/:id/staff', authorize('SUPER_ADMIN'), validate(createStaffSchema), clinicController.createStaff);
router.patch('/:id/staff/:userId/toggle-active', authorizeClinicAdminDoctor('SUPER_ADMIN', 'CLINIC_ADMIN'), clinicController.toggleStaffActive);
router.delete('/:id/staff/:userId', authorize('SUPER_ADMIN'), clinicController.deleteStaff);

export default router;
