import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    visitId: z.string().min(1, 'Visit is required'),
    patientId: z.string().min(1, 'Patient is required'),
    amount: z.number().positive('Amount must be positive'),
    discount: z.number().min(0).default(0),
    paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'ONLINE']).default('CASH'),
    paymentStatus: z.enum(['PAID', 'PENDING', 'REFUNDED']).default('PAID'),
    referenceNo: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const updatePaymentSchema = z.object({
  body: z.object({
    paymentStatus: z.enum(['PAID', 'PENDING', 'REFUNDED']).optional(),
    referenceNo: z.string().optional(),
    notes: z.string().optional(),
  }),
});
