import prisma from '../../config/database';

export class DashboardService {
  async getDashboardStats(clinicId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(tomorrow);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const clinicFilter = clinicId ? { clinicId } : {};
    const todayFilter = { ...clinicFilter, visitDate: { gte: today, lt: tomorrow } };
    const todayPaymentFilter = { ...clinicFilter, createdAt: { gte: today, lt: tomorrow } };

    const [
      todayPatients,
      todayRevenue,
      yesterdayPatients,
      yesterdayRevenue,
      waitingPatients,
      inConsultation,
      completedConsultations,
      skippedToday,
      totalDoctors,
      availableDoctors,
      totalPatients,
      monthlyRevenue,
      dailyRevenue,
      doctorStats,
      recentVisits,
      recentPayments,
      paymentBreakdown,
      topDiagnoses,
    ] = await Promise.all([
      prisma.visit.count({ where: todayFilter }),
      prisma.payment.aggregate({
        where: { ...todayPaymentFilter, paymentStatus: 'PAID' },
        _sum: { netAmount: true },
      }),
      prisma.visit.count({
        where: { ...clinicFilter, visitDate: { gte: yesterday, lt: yesterdayEnd } },
      }),
      prisma.payment.aggregate({
        where: { ...clinicFilter, createdAt: { gte: yesterday, lt: yesterdayEnd }, paymentStatus: 'PAID' },
        _sum: { netAmount: true },
      }),
      prisma.visit.count({
        where: { ...todayFilter, status: 'WAITING' },
      }),
      prisma.visit.count({
        where: { ...todayFilter, status: 'IN_CONSULTATION' },
      }),
      prisma.visit.count({
        where: { ...todayFilter, status: 'COMPLETED' },
      }),
      prisma.visit.count({
        where: { ...todayFilter, status: 'SKIPPED' },
      }),
      prisma.doctor.count({ where: clinicFilter }),
      prisma.doctor.count({ where: { ...clinicFilter, isAvailable: true } }),
      prisma.patient.count({ where: clinicFilter }),
      prisma.payment.aggregate({
        where: { ...clinicFilter, createdAt: { gte: startOfMonth }, paymentStatus: 'PAID' },
        _sum: { netAmount: true },
      }),
      this.getDailyRevenue(7, clinicId),
      this.getDoctorStats(today, tomorrow, clinicId),
      this.getRecentActivities(today, clinicId),
      this.getRecentPayments(today, clinicId),
      this.getPaymentBreakdown(today, tomorrow, clinicId),
      this.getTopDiagnoses(today, tomorrow, clinicId),
    ]);

    const todayRev = todayRevenue._sum.netAmount || 0;
    const yestRev = yesterdayRevenue._sum.netAmount || 0;
    const revTrend = yestRev > 0 ? Math.round(((todayRev - yestRev) / yestRev) * 100) : 0;
    const patTrend = yesterdayPatients > 0 ? Math.round(((todayPatients - yesterdayPatients) / yesterdayPatients) * 100) : 0;

    return {
      stats: {
        todayPatients,
        todayRevenue: todayRev,
        waitingPatients,
        inConsultation,
        completedConsultations,
        skippedToday,
        totalDoctors,
        availableDoctors,
        totalPatients,
        monthlyRevenue: monthlyRevenue._sum.netAmount || 0,
        yesterdayPatients,
        yesterdayRevenue: yestRev,
        revTrend,
        patTrend,
      },
      patientFlow: {
        registered: todayPatients,
        waiting: waitingPatients,
        inConsultation,
        completed: completedConsultations,
        skipped: skippedToday,
      },
      charts: {
        dailyRevenue,
        doctorStats,
      },
      recentActivities: [...recentVisits, ...recentPayments]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8),
      paymentBreakdown,
      topDiagnoses,
    };
  }

  async getSuperAdminStats() {
    const [totalClinics, activeClinics, totalPatients, totalDoctors, totalUsers, totalRevenue] = await Promise.all([
      prisma.clinic.count(),
      prisma.clinic.count({ where: { isActive: true } }),
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.user.count(),
      prisma.payment.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { netAmount: true },
      }),
    ]);

    return {
      stats: {
        totalClinics,
        activeClinics,
        totalPatients,
        totalDoctors,
        totalUsers,
        totalRevenue: totalRevenue._sum.netAmount || 0,
      },
    };
  }

  private async getRecentActivities(today: Date, clinicId?: string) {
    const clinicFilter = clinicId ? { clinicId } : {};
    const recentVisits = await prisma.visit.findMany({
      where: { ...clinicFilter, visitDate: { gte: today } },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return recentVisits.map((v) => ({
      type: 'visit' as const,
      label: `Patient ${v.patient.firstName} ${v.patient.lastName} registered with Dr. ${v.doctor.user.firstName}`,
      status: v.status,
      time: v.createdAt,
    }));
  }

  private async getRecentPayments(today: Date, clinicId?: string) {
    const clinicFilter = clinicId ? { clinicId } : {};
    const recentPayments = await prisma.payment.findMany({
      where: { ...clinicFilter, createdAt: { gte: today } },
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return recentPayments.map((p) => ({
      type: 'payment' as const,
      label: `Payment ₹${p.netAmount} recorded from ${p.patient.firstName} ${p.patient.lastName}`,
      status: p.paymentStatus,
      time: p.createdAt,
    }));
  }

  private async getPaymentBreakdown(today: Date, tomorrow: Date, clinicId?: string) {
    const clinicFilter = clinicId ? { clinicId } : {};
    const payments = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { ...clinicFilter, createdAt: { gte: today, lt: tomorrow } },
      _sum: { netAmount: true },
      _count: true,
    });

    const pending = await prisma.payment.aggregate({
      where: { ...clinicFilter, createdAt: { gte: today, lt: tomorrow }, paymentStatus: 'PENDING' },
      _sum: { netAmount: true },
    });

    const result: Array<{ method: string; amount: number; count: number }> = [];
    for (const p of payments) {
      result.push({
        method: p.paymentMethod,
        amount: p._sum.netAmount || 0,
        count: p._count,
      });
    }

    const pendingAmount = pending._sum.netAmount || 0;
    if (pendingAmount > 0) {
      result.push({ method: 'DUE', amount: pendingAmount, count: 0 });
    }

    return result;
  }

  private async getTopDiagnoses(today: Date, tomorrow: Date, clinicId?: string) {
    const clinicFilter = clinicId ? { clinicId } : {};
    const visits = await prisma.visit.findMany({
      where: { ...clinicFilter, visitDate: { gte: today, lt: tomorrow }, diagnosis: { not: null } },
      select: { diagnosis: true },
    });

    const counts: Record<string, number> = {};
    for (const v of visits) {
      const d = (v.diagnosis || '').trim();
      if (d) counts[d] = (counts[d] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private async getDailyRevenue(days: number, clinicId?: string) {
    const queries = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      queries.push(
        prisma.payment.aggregate({
          where: { ...(clinicId ? { clinicId } : {}), createdAt: { gte: date, lt: nextDate }, paymentStatus: 'PAID' },
          _sum: { netAmount: true },
        }).then(r => ({ date, revenue: r._sum.netAmount || 0 })),
      );

      queries.push(
        prisma.visit.count({
          where: { ...(clinicId ? { clinicId } : {}), visitDate: { gte: date, lt: nextDate } },
        }).then(count => ({ date, patients: count })),
      );
    }

    const results = await Promise.all(queries);
    const grouped: Record<string, any> = {};
    for (const r of results) {
      const key = r.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (!grouped[key]) grouped[key] = { date: key, revenue: 0, patients: 0 };
      if ('revenue' in r) grouped[key].revenue = (r as any).revenue;
      if ('patients' in r) grouped[key].patients = (r as any).patients;
    }
    return Object.values(grouped);
  }

  private async getDoctorStats(today: Date, tomorrow: Date, clinicId?: string) {
    const doctors = await prisma.doctor.findMany({
      where: { ...(clinicId ? { clinicId } : {}) },
      include: {
        user: { select: { firstName: true, lastName: true } },
        _count: {
          select: {
            visits: {
              where: { visitDate: { gte: today, lt: tomorrow } },
            },
          },
        },
      },
    });

    return doctors.map((d) => ({
      id: d.id,
      name: `Dr. ${d.user.firstName} ${d.user.lastName}`,
      specialization: d.specialization,
      todayPatients: d._count.visits,
      isAvailable: d.isAvailable,
    }));
  }
}

export const dashboardService = new DashboardService();
