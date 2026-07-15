import { z } from 'zod';

export const createDoctorSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
    specialization: z.string().optional(),
    qualification: z.string().optional(),
    registrationNo: z.string().optional(),
    consultationFee: z.number().nonnegative().default(0),
    availableDays: z.array(z.string()).optional(),
    availableSlots: z.array(z.string()).optional(),
    bio: z.string().optional(),
    isClinicAdmin: z.boolean().optional(),
  }),
});

export const updateDoctorSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    specialization: z.string().optional(),
    qualification: z.string().optional(),
    registrationNo: z.string().optional(),
    consultationFee: z.number().nonnegative().optional(),
    availableDays: z.array(z.string()).optional(),
    availableSlots: z.array(z.string()).optional(),
    bio: z.string().optional(),
    isAvailable: z.boolean().optional(),
    isClinicAdmin: z.boolean().optional(),
  }),
});
