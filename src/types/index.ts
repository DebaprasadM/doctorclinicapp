import { Request } from 'express';

export type Role = 'SUPER_ADMIN' | 'CLINIC_ADMIN' | 'DOCTOR' | 'RECEPTIONIST';

export type VisitStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'ONLINE';
export type ConsultationType = 'GENERAL' | 'FOLLOW_UP' | 'EMERGENCY';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface JwtPayload {
  userId: string;
  clinicId?: string;
  role: Role;
  sessionId: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}
