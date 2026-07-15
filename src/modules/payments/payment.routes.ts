import { Router } from 'express';
import { paymentController } from './payment.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authorize } from '../../middlewares/rbac';
import { createPaymentSchema } from './payment.validator';

const router = Router();

router.use(authenticate);

router.get('/today', paymentController.getTodayCollection);
router.get('/', paymentController.findAll);
router.get('/:id', paymentController.findById);
router.post('/', authorize('SUPER_ADMIN', 'CLINIC_ADMIN', 'RECEPTIONIST'), validate(createPaymentSchema), paymentController.create);
router.post('/:id/refund', authorize('SUPER_ADMIN', 'CLINIC_ADMIN'), paymentController.refund);

export default router;
