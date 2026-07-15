import { Router } from 'express';
import { settingController } from './setting.controller';
import { authenticate } from '../../middlewares/auth';
import { authorizeClinicAdminDoctor } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    code: z.string().optional(),
    description: z.string().optional(),
  }),
});

const router = Router();

router.use(authenticate);
router.use(authorizeClinicAdminDoctor('SUPER_ADMIN', 'CLINIC_ADMIN'));

router.get('/clinic', settingController.getClinicInfo);
router.put('/clinic', settingController.updateClinicInfo);
router.get('/', settingController.getSettings);
router.put('/', settingController.updateSettings);
router.get('/whatsapp', settingController.getWhatsAppConfig);
router.put('/whatsapp', settingController.updateWhatsAppConfig);
router.get('/prescription-template', settingController.getPrescriptionTemplate);
router.put('/prescription-template', settingController.updatePrescriptionTemplate);
router.get('/consultation-fees', settingController.getConsultationFees);
router.put('/consultation-fees', settingController.updateConsultationFees);
router.get('/departments', settingController.getDepartments);
router.post('/departments', validate(createDepartmentSchema), settingController.createDepartment);

export default router;
