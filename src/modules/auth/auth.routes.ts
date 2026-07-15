import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { loginSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, checkSessionsSchema } from './auth.validator';

const router = Router();

router.post('/check-sessions', validate(checkSessionsSchema), authController.checkSessions);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/logout-all', authenticate, authController.logoutFromAllDevices);
router.post('/switch-clinic', authenticate, authController.switchClinic);

export default router;
