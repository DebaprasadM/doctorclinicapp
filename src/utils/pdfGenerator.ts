import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface PrescriptionData {
  id: string;
  prescriptionNo: string;
  diagnosis?: string | null;
  clinicalNotes?: string | null;
  investigations?: string | null;
  advice?: string | null;
  nextVisitDate?: Date | null;
  expiryDate?: Date | null;
  pdfUrl?: string | null;
  createdAt: Date;
  patient: {
    patientId: string;
    firstName: string;
    lastName: string;
    age?: number | null;
    gender: string;
    phone: string;
    address?: string | null;
    bloodGroup?: string | null;
  };
  doctor: {
    user: { firstName: string; lastName: string; qualification?: string | null; registrationNo?: string | null };
    specialization?: string | null;
    consultationFee?: number;
  };
  clinic?: {
    name: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logo?: string | null;
  };
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string | null;
    route?: string | null;
  }>;
  visit?: {
    tokenNumber: number;
    consultationType: string;
    visitDate: Date;
  };
}

export async function generatePrescriptionPDF(data: PrescriptionData, clinicId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const dir = path.join(__dirname, '../../prescriptions');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filename = `${data.prescriptionNo}.pdf`;
      const filePath = path.join(dir, filename);
      
      // Generate QR code
      const prescriptionUrl = `${env.FRONTEND_URL}/prescriptions/${data.prescriptionNo}`;
      const qrCodeDataUrl = await QRCode.toDataURL(prescriptionUrl);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width - 100;
      const leftMargin = 50;
      let y = 50;

      // Helper functions
      function drawLine(yPos: number) {
        doc.moveTo(leftMargin, yPos).lineTo(leftMargin + pageWidth, yPos).stroke('#ccc');
      }

      // Header - Clinic Info
      if (data.clinic) {
        doc.fontSize(20).font('Helvetica-Bold').text(data.clinic.name || 'Clinic Name', leftMargin, y, { align: 'center' });
        y += 25;
        doc.fontSize(10).font('Helvetica');
        if (data.clinic.address) doc.text(data.clinic.address, { align: 'center' });
        if (data.clinic.phone) doc.text(`Phone: ${data.clinic.phone}`, { align: 'center' });
        if (data.clinic.email) doc.text(`Email: ${data.clinic.email}`, { align: 'center' });
        y = doc.y + 10;
      } else {
        doc.fontSize(20).font('Helvetica-Bold').text('Clinic Name', leftMargin, y, { align: 'center' });
        y += 30;
      }

      drawLine(y);
      y += 10;

      // Prescription Header
      doc.fontSize(16).font('Helvetica-Bold').text('PRESCRIPTION', leftMargin, y, { align: 'center' });
      y += 25;

      // Doctor & Prescription Info side by side
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Dr. ${data.doctor.user.firstName} ${data.doctor.user.lastName}`, leftMargin, y);
      if (data.doctor.specialization) {
        doc.font('Helvetica').text(`Specialization: ${data.doctor.specialization}`);
      }
      if (data.doctor.user.qualification) {
        doc.text(`Qualification: ${data.doctor.user.qualification}`);
      }
      if (data.doctor.user.registrationNo) {
        doc.text(`Reg. No: ${data.doctor.user.registrationNo}`);
      }

      // Right side: Prescription info
      const rightX = pageWidth / 2 + leftMargin;
      doc.font('Helvetica');
      doc.text(`Prescription No: ${data.prescriptionNo}`, rightX, y);
      if (data.visit) {
        doc.text(`Date: ${new Date(data.visit.visitDate).toLocaleDateString('en-IN')}`);
        doc.text(`Token #: ${data.visit.tokenNumber}`);
        doc.text(`Type: ${data.visit.consultationType}`);
      }

      y = Math.max(doc.y + 10, y + 80);
      drawLine(y);
      y += 10;

      // Patient Details
      doc.fontSize(12).font('Helvetica-Bold').text('Patient Details', leftMargin, y);
      y += 20;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${data.patient.firstName} ${data.patient.lastName}`, leftMargin, y);
      doc.text(`ID: ${data.patient.patientId}`, rightX, y);
      y += 15;
      doc.text(`Age/Gender: ${data.patient.age || 'N/A'} / ${data.patient.gender}`, leftMargin, y);
      doc.text(`Blood Group: ${data.patient.bloodGroup || 'N/A'}`, rightX, y);
      y += 15;
      doc.text(`Phone: ${data.patient.phone}`, leftMargin, y);
      y += 25;

      drawLine(y);
      y += 15;

      // Diagnosis
      if (data.diagnosis) {
        doc.fontSize(12).font('Helvetica-Bold').text('Diagnosis', leftMargin, y);
        y += 20;
        doc.fontSize(10).font('Helvetica').text(data.diagnosis, leftMargin, y);
        y = doc.y + 15;
      }

      // Investigations
      if (data.investigations) {
        doc.fontSize(12).font('Helvetica-Bold').text('Investigations', leftMargin, y);
        y += 20;
        doc.fontSize(10).font('Helvetica').text(data.investigations, leftMargin, y);
        y = doc.y + 15;
      }

      // Medicines Table
      if (data.medicines.length > 0) {
        if (y > doc.page.height - 200) {
          doc.addPage();
          y = 50;
        }

        doc.fontSize(12).font('Helvetica-Bold').text('Medicines', leftMargin, y);
        y += 20;

        // Table header
        const col1 = leftMargin;
        const col2 = leftMargin + 120;
        const col3 = leftMargin + 200;
        const col4 = leftMargin + 280;
        const col5 = leftMargin + 350;
        const rowHeight = 20;

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
        doc.text('Medicine', col1, y);
        doc.text('Dosage', col2, y);
        doc.text('Frequency', col3, y);
        doc.text('Duration', col4, y);
        doc.text('Route', col5, y);
        
        drawLine(y + 15);
        y += 20;

        doc.fontSize(9).font('Helvetica').fillColor('#000');
        for (const med of data.medicines) {
          if (y > doc.page.height - 100) {
            doc.addPage();
            y = 50;
          }
          doc.text(med.name, col1, y, { width: 110 });
          doc.text(med.dosage, col2, y, { width: 75 });
          doc.text(med.frequency, col3, y, { width: 75 });
          doc.text(med.duration, col4, y, { width: 65 });
          doc.text(med.route || '-', col5, y, { width: 60 });
          
          if (med.instructions) {
            y += 15;
            doc.fontSize(8).fillColor('#666').text(`Instructions: ${med.instructions}`, leftMargin + 10, y);
            doc.fillColor('#000');
          }
          y += 20;
        }
        y += 10;
      }

      // Advice
      if (data.advice) {
        if (y > doc.page.height - 150) {
          doc.addPage();
          y = 50;
        }
        drawLine(y);
        y += 15;
        doc.fontSize(12).font('Helvetica-Bold').text('Advice', leftMargin, y);
        y += 20;
        doc.fontSize(10).font('Helvetica').text(data.advice, leftMargin, y);
        y = doc.y + 15;
      }

      // Next Visit
      if (data.nextVisitDate) {
        doc.fontSize(10).font('Helvetica-Bold').text(`Next Visit: ${new Date(data.nextVisitDate).toLocaleDateString('en-IN')}`, leftMargin, y);
        y += 25;
      }

      // Footer with QR and Signature
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 50;
      }

      drawLine(y);
      y += 15;

      // QR Code
      try {
        doc.image(qrCodeDataUrl, leftMargin, y, { width: 80, height: 80 });
      } catch (e) {
        // QR generation may fail in some environments
      }

      // Doctor Signature
      doc.fontSize(10).font('Helvetica');
      doc.text(
        `Doctor's Signature`,
        rightX,
        y + 30,
        { align: 'right' }
      );
      doc.font('Helvetica-Bold');
      doc.text(
        `Dr. ${data.doctor.user.firstName} ${data.doctor.user.lastName}`,
        rightX,
        y + 45,
        { align: 'right' }
      );

      y += 100;

      // Footer
      drawLine(y);
      y += 10;
      doc.fontSize(8).font('Helvetica').fillColor('#999');
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, leftMargin, y, { align: 'center' });
      doc.fontSize(7).text(`This is a computer-generated prescription. Valid until: ${data.expiryDate ? new Date(data.expiryDate).toLocaleDateString('en-IN') : 'N/A'}`, { align: 'center' });
      doc.fillColor('#000');

      doc.end();

      stream.on('finish', () => {
        const relativePath = `/prescriptions/${filename}`;
        resolve(relativePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      logger.error('PDF generation error', { error });
      reject(error);
    }
  });
}
