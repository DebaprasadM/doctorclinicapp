import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export class SettingService {
  async getClinicSettings(clinicId?: string) {
    const where = clinicId ? { clinicId } : {};
    const settings = await prisma.clinicSetting.findMany({ where });
    const map: Record<string, any> = {};
    for (const s of settings) {
      try { map[s.key] = JSON.parse(s.value); } catch { map[s.key] = s.value; }
    }
    return map;
  }

  async updateSetting(clinicId: string | undefined, key: string, value: any) {
    if (!clinicId) throw new AppError('Clinic ID required', 400);

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    const setting = await prisma.clinicSetting.upsert({
      where: { key_clinicId: { key, clinicId } },
      update: { value: stringValue },
      create: { key, value: stringValue, clinicId },
    });

    return setting;
  }

  async updateBulkSettings(clinicId: string | undefined, settings: Record<string, any>) {
    for (const [key, value] of Object.entries(settings)) {
      await this.updateSetting(clinicId, key, value);
    }
    return this.getClinicSettings(clinicId);
  }

  async getClinicInfo(clinicId?: string) {
    if (!clinicId) throw new AppError('Clinic ID required', 400);
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, email: true, phone: true, address: true, logo: true, timezone: true },
    });
    if (!clinic) throw new AppError('Clinic not found', 404);
    return clinic;
  }

  async updateClinicInfo(clinicId: string | undefined, data: any) {
    if (!clinicId) throw new AppError('Clinic ID required', 400);
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;

    return prisma.clinic.update({ where: { id: clinicId }, data: updateData });
  }

  async uploadLogo(clinicId: string | undefined, filePath: string) {
    if (!clinicId) throw new AppError('Clinic ID required', 400);
    return prisma.clinic.update({ where: { id: clinicId }, data: { logo: filePath } });
  }

  async getWhatsAppConfig(clinicId?: string) {
    const settings = await this.getClinicSettings(clinicId);
    return {
      enabled: settings.whatsappEnabled || false,
      apiKey: settings.whatsappApiKey || '',
      phoneNumberId: settings.whatsappPhoneNumberId || '',
      businessAccountId: settings.whatsappBusinessAccountId || '',
      templateName: settings.whatsappTemplateName || 'prescription_ready',
    };
  }

  async updateWhatsAppConfig(clinicId: string | undefined, config: any) {
    const settings: Record<string, any> = {};
    if (config.enabled !== undefined) settings.whatsappEnabled = config.enabled;
    if (config.apiKey) settings.whatsappApiKey = config.apiKey;
    if (config.phoneNumberId) settings.whatsappPhoneNumberId = config.phoneNumberId;
    if (config.businessAccountId) settings.whatsappBusinessAccountId = config.businessAccountId;
    if (config.templateName) settings.whatsappTemplateName = config.templateName;
    return this.updateBulkSettings(clinicId, settings);
  }

  async getPrescriptionTemplate(clinicId?: string) {
    const settings = await this.getClinicSettings(clinicId);
    return settings.prescriptionTemplate || {
      templateId: 'classic',
      showLogo: true,
      showDoctorSignature: true,
      showQRCode: true,
      headerColor: '#1a365d',
      fontSize: 'normal',
    };
  }

  async updatePrescriptionTemplate(clinicId: string | undefined, template: any) {
    return this.updateSetting(clinicId, 'prescriptionTemplate', template);
  }

  async getConsultationFees(clinicId?: string) {
    const settings = await this.getClinicSettings(clinicId);
    return settings.consultationFees || { general: 0, followUp: 0, emergency: 0 };
  }

  async updateConsultationFees(clinicId: string | undefined, fees: any) {
    return this.updateSetting(clinicId, 'consultationFees', fees);
  }

  async getDepartments(clinicId?: string) {
    if (!clinicId) throw new AppError('Clinic ID required', 400);
    return prisma.department.findMany({
      where: { clinicId },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(clinicId: string | undefined, data: { name: string; code?: string; description?: string }) {
    if (!clinicId) throw new AppError('Clinic ID required', 400);
    return prisma.department.create({
      data: { name: data.name, code: data.code, description: data.description, clinicId },
    });
  }
}

export const settingService = new SettingService();
