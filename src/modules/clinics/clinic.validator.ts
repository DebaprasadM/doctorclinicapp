import { z } from 'zod';

export const createClinicSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Clinic name is required'),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
  }),
});

export const updateClinicSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    timezone: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createAdminSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
  }),
});

export const createStaffSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    role: z.enum(['CLINIC_ADMIN', 'RECEPTIONIST']).optional(),
  }),
});
