import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/overview', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalTrips, completedTrips, totalRevenue, fuelCost, avgOccupancy] = await Promise.all([
      prisma.trip.count({ where: { departureTime: { gte: thirtyDaysAgo } } }),
      prisma.trip.count({ where: { departureTime: { gte: thirtyDaysAgo }, status: 'COMPLETED' } }),
      prisma.trip.aggregate({ _sum: { occupancy: true }, where: { departureTime: { gte: thirtyDaysAgo } } }),
      prisma.fuelRecord.aggregate({ _sum: { totalCost: true }, where: { date: { gte: thirtyDaysAgo } } }),
      prisma.trip.aggregate({ _avg: { occupancy: true }, where: { departureTime: { gte: thirtyDaysAgo } } }),
    ]);

    ResponseHandler.success(res, {
      totalTrips, completedTrips,
      estimatedRevenue: (totalRevenue._sum.occupancy || 0) * 15, // avg fare ₹15
      fuelCost: fuelCost._sum.totalCost || 0,
      avgOccupancy: Math.round(avgOccupancy._avg.occupancy || 0),
      completionRate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0,
    });
  } catch (e) { next(e); }
});

router.get('/trends', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Generate 30-day trend data
    const trends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i); date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);

      const [trips, fuel] = await Promise.all([
        prisma.trip.count({ where: { departureTime: { gte: date, lt: nextDate } } }),
        prisma.fuelRecord.aggregate({ _sum: { totalCost: true }, where: { date: { gte: date, lt: nextDate } } }),
      ]);

      trends.push({
        date: date.toISOString().split('T')[0],
        trips,
        fuelCost: fuel._sum.totalCost || 0,
        revenue: trips * 45 * 15, // avg passengers * avg fare
      });
    }
    ResponseHandler.success(res, trends);
  } catch (e) { next(e); }
});

router.get('/route-performance', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const routes = await prisma.route.findMany({
      where: { isActive: true },
      include: { _count: { select: { trips: true } }, trips: { select: { occupancy: true, delay: true }, take: 100 } },
    });

    const performance = routes.map(r => ({
      routeNumber: r.routeNumber, name: r.name,
      totalTrips: r._count.trips,
      avgOccupancy: r.trips.length > 0 ? Math.round(r.trips.reduce((s, t) => s + t.occupancy, 0) / r.trips.length) : 0,
      avgDelay: r.trips.length > 0 ? Math.round(r.trips.reduce((s, t) => s + t.delay, 0) / r.trips.length) : 0,
      efficiency: r._count.trips > 0 ? Math.round(((r._count.trips - r.trips.filter(t => t.delay > 5).length) / r._count.trips) * 100) : 0,
    }));

    ResponseHandler.success(res, performance);
  } catch (e) { next(e); }
});

router.get('/driver-performance', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const drivers = await prisma.driver.findMany({
      take: 20, orderBy: { performanceScore: 'desc' },
      include: { user: { select: { firstName: true, lastName: true } }, _count: { select: { trips: true } } },
    });
    ResponseHandler.success(res, drivers);
  } catch (e) { next(e); }
});

export default router;
