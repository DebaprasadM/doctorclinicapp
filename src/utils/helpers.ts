export function generatePatientId(clinicId?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PT-${(clinicId || 'SAAS').substring(0, 4).toUpperCase()}-${timestamp}-${random}`;
}

export function generatePrescriptionNumber(clinicId?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RX-${(clinicId || 'SAAS').substring(0, 4).toUpperCase()}-${timestamp}-${random}`;
}

export function generateReceiptNumber(clinicId?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${(clinicId || 'SAAS').substring(0, 4).toUpperCase()}-${timestamp}-${random}`;
}

export function generateTokenNumber(doctorId: string, date: Date, visitCount: number): number {
  return visitCount + 1;
}

export function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
