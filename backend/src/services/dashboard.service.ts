import prisma from '../config/database';

export class DashboardService {
  static async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalBuses, activeBuses, maintenanceBuses, inactiveBuses,
      totalDrivers, availableDrivers,
      todaysTrips, completedTrips, cancelledTrips, inProgressTrips,
      fuelRecords, maintenanceDue,
      delayedTrips, allTripsToday,
    ] = await Promise.all([
      prisma.bus.count(),
      prisma.bus.count({ where: { status: 'ACTIVE' } }),
      prisma.bus.count({ where: { status: 'MAINTENANCE' } }),
      prisma.bus.count({ where: { status: 'INACTIVE' } }),
      prisma.driver.count(),
      prisma.driver.count({ where: { isAvailable: true } }),
      prisma.trip.count({ where: { departureTime: { gte: today, lt: tomorrow } } }),
      prisma.trip.count({ where: { departureTime: { gte: today, lt: tomorrow }, status: 'COMPLETED' } }),
      prisma.trip.count({ where: { departureTime: { gte: today, lt: tomorrow }, status: 'CANCELLED' } }),
      prisma.trip.count({ where: { departureTime: { gte: today, lt: tomorrow }, status: 'IN_PROGRESS' } }),
      prisma.fuelRecord.aggregate({ _sum: { quantity: true }, where: { date: { gte: today, lt: tomorrow } } }),
      prisma.maintenanceRecord.count({ where: { status: 'PENDING', scheduledDate: { lte: tomorrow } } }),
      prisma.trip.findMany({ where: { departureTime: { gte: today, lt: tomorrow }, delay: { gt: 0 } }, select: { delay: true } }),
      prisma.trip.findMany({ where: { departureTime: { gte: today, lt: tomorrow }, occupancy: { gt: 0 } }, select: { occupancy: true, maxOccupancy: true } }),
    ]);

    const avgDelay = delayedTrips.length > 0
      ? Math.round(delayedTrips.reduce((sum, t) => sum + t.delay, 0) / delayedTrips.length)
      : 0;

    const occupancyPct = allTripsToday.length > 0
      ? Math.round(allTripsToday.reduce((sum, t) => sum + ((t.occupancy / (t.maxOccupancy || 55)) * 100), 0) / allTripsToday.length)
      : 0;

    return {
      totalBuses,
      availableBuses: activeBuses,
      runningBuses: inProgressTrips,
      inactiveBuses: inactiveBuses + maintenanceBuses,
      driversAvailable: availableDrivers,
      driversOnDuty: totalDrivers - availableDrivers,
      todaysTrips,
      completedTrips,
      cancelledTrips,
      fuelConsumption: fuelRecords._sum.quantity || 0,
      maintenanceDue,
      averageDelay: avgDelay,
      occupancyPercentage: occupancyPct,
    };
  }

  static async getRecentActivities(limit = 20) {
    return prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
    });
  }

  static async getChartData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [tripsPerDay, fuelPerDay] = await Promise.all([
      prisma.trip.groupBy({
        by: ['status'],
        _count: true,
        where: { departureTime: { gte: thirtyDaysAgo } },
      }),
      prisma.fuelRecord.aggregate({
        _sum: { totalCost: true, quantity: true },
        where: { date: { gte: thirtyDaysAgo } },
      }),
    ]);

    return { tripsPerDay, fuelPerDay };
  }
}
