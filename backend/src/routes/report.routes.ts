import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [data, total] = await Promise.all([
      prisma.report.findMany({
        skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { firstName: true, lastName: true } } },
      }),
      prisma.report.count(),
    ]);
    ResponseHandler.paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { next(e); }
});

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, category, dateFrom, dateTo } = req.body;
    // Generate report data based on category
    let reportData: any = {};

    if (category === 'bus_utilization') {
      const buses = await prisma.bus.findMany({ include: { _count: { select: { trips: true } } } });
      reportData = buses.map(b => ({ busNumber: b.busNumber, trips: b._count.trips, status: b.status }));
    } else if (category === 'fuel') {
      reportData = await prisma.fuelRecord.aggregate({
        _sum: { totalCost: true, quantity: true }, _avg: { mileage: true },
        where: { date: { gte: new Date(dateFrom), lte: new Date(dateTo) } },
      });
    } else if (category === 'driver_performance') {
      const drivers = await prisma.driver.findMany({
        select: { employeeId: true, performanceScore: true, totalTrips: true,
          user: { select: { firstName: true, lastName: true } } },
        orderBy: { performanceScore: 'desc' },
      });
      reportData = drivers;
    }

    const report = await prisma.report.create({
      data: { title: `${category} Report`, type, category, dateFrom: new Date(dateFrom), dateTo: new Date(dateTo), data: reportData, userId: req.user!.userId },
    });
    ResponseHandler.created(res, report, 'Report generated');
  } catch (e) { next(e); }
});

export default router;
