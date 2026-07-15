import { JwtPayload } from '../types';

export function getClinicScope(user?: JwtPayload): string | undefined {
  return user?.clinicId;
}
