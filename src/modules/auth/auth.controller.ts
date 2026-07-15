import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthRequest } from '../../types';

export class AuthController {
  async checkSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.checkSessions(email);
      res.json({ success: true, message: 'Session check complete', data: result });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      
      const result = await authService.login(email, password, userAgent, ipAddress);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      await authService.logout(token);
      res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await authService.getProfile(req.user!.userId, req.user!.clinicId);
      res.json({
        success: true,
        message: 'Profile fetched successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async switchClinic(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clinicId } = req.body;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      const result = await authService.switchClinic(req.user!.userId, clinicId, userAgent, ipAddress);
      res.json({ success: true, message: 'Clinic switched successfully', data: result });
    } catch (error) {
      next(error);
    }
  }

  async logoutFromAllDevices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logoutFromAllDevices(req.user!.userId);
      res.json({ success: true, message: 'Logged out from all devices' });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
