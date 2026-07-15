import { z } from 'zod';

const medicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.string().min(1, 'Duration is required'),
  instructions: z.string().optional(),
  route: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  body: z.object({
    visitId: z.string().min(1, 'Visit is required'),
    diagnosis: z.string().optional(),
    clinicalNotes: z.string().optional(),
    investigations: z.string().optional(),
    advice: z.string().optional(),
    nextVisitDate: z.string().optional(),
    medicines: z.array(medicineSchema).min(1, 'At least one medicine is required'),
    sendViaWhatsApp: z.boolean().default(false),
  }),
});

export const updatePrescriptionSchema = z.object({
  body: z.object({
    diagnosis: z.string().optional(),
    clinicalNotes: z.string().optional(),
    investigations: z.string().optional(),
    advice: z.string().optional(),
    nextVisitDate: z.string().optional(),
    medicines: z.array(medicineSchema).optional(),
  }),
});
