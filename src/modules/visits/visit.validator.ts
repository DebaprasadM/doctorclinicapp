import { z } from 'zod';

export const createVisitSchema = z.object({
  body: z.object({
    patientId: z.string().min(1, 'Patient is required'),
    doctorId: z.string().min(1, 'Doctor is required'),
    consultationType: z.enum(['GENERAL', 'FOLLOW_UP', 'EMERGENCY']).default('GENERAL'),
    symptoms: z.string().optional(),
    vitals: z.object({
      bloodPressure: z.string().optional(),
      pulse: z.number().optional(),
      temperature: z.number().optional(),
      weight: z.number().optional(),
      height: z.number().optional(),
      spo2: z.number().optional(),
    }).optional(),
    payment: z.object({
      amount: z.number().positive(),
      discount: z.number().min(0).default(0),
      paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'ONLINE']).default('CASH'),
      paymentStatus: z.enum(['PAID', 'PENDING']).default('PAID'),
      referenceNo: z.string().optional(),
      notes: z.string().optional(),
    }).optional(),
  }),
});

export const updateVisitStatusSchema = z.object({
  body: z.object({
    status: z.enum(['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED'], { required_error: 'Status is required' }),
  }),
});

export const updateVisitSchema = z.object({
  body: z.object({
    consultationType: z.enum(['GENERAL', 'FOLLOW_UP', 'EMERGENCY']).optional(),
    symptoms: z.string().optional(),
    vitals: z.string().optional(),
    status: z.enum(['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED']).optional(),
    diagnosis: z.string().optional(),
    clinicalNotes: z.string().optional(),
  }),
});
