import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    dateOfBirth: z.string().optional(),
    age: z.number().int().positive().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    phone: z.string().min(10, 'Valid phone number is required'),
    whatsappNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    occupation: z.string().optional(),
    medicalNotes: z.string().optional(),
  }),
});

const paymentSchema = z.object({
  amount: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'ONLINE']).optional(),
  paymentStatus: z.enum(['PAID', 'PENDING']).optional(),
});

export const registerWithOPDSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    dateOfBirth: z.string().optional(),
    age: z.number().int().positive().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    phone: z.string().min(10, 'Valid phone number is required'),
    whatsappNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    occupation: z.string().optional(),
    medicalNotes: z.string().optional(),
    doctorId: z.string().min(1, 'Doctor is required'),
    consultationType: z.enum(['GENERAL', 'FOLLOW_UP', 'EMERGENCY']).optional(),
    symptoms: z.string().optional(),
    vitals: z.any().optional(),
    payment: paymentSchema.optional(),
  }),
});

export const updatePatientSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().optional(),
    age: z.number().int().positive().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    phone: z.string().min(10).optional(),
    whatsappNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    occupation: z.string().optional(),
    medicalNotes: z.string().optional(),
  }),
});
