import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, scheduleId, busId, driverId, routeId, status } = req.query;
    const where: any = {};
    if (scheduleId) where.scheduleId = scheduleId;
    if (busId) where.busId = busId;
    if (driverId) where.driverId = driverId;
    if (routeId) where.routeId = routeId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.trip.findMany({
        where, skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        orderBy: { departureTime: 'desc' },
        include: {
          bus: { select: { busNumber: true } },
          driver: { select: { employeeId: true, user: { select: { firstName: true, lastName: true } } } },
          route: { select: { routeNumber: true, name: true } },
        },
      }),
      prisma.trip.count({ where }),
    ]);
    ResponseHandler.paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { next(e); }
});

router.get('/daily-report', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    if (!date) throw new Error('Date is required');

    const targetDate = new Date(date as string);
    const startDate = new Date(targetDate.setHours(0, 0, 0, 0));
    const endDate = new Date(targetDate.setHours(23, 59, 59, 999));

    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { actualDeparture: { gte: startDate, lte: endDate } },
          { departureTime: { gte: startDate, lte: endDate } }
        ]
      },
      include: {
        bus: true,
        driver: { include: { user: true } },
        route: true,
        boardingLogs: {
          include: {
            student: { include: { user: true } }
          }
        }
      },
      orderBy: { actualDeparture: 'asc' },
    });
    
    ResponseHandler.success(res, trips);
  } catch (e) { next(e); }
});

router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busId, driverId } = req.query;
    if (!busId && !driverId) throw new Error('Must provide busId or driverId');
    
    const where: any = { status: { in: ['IN_PROGRESS', 'PAUSED'] } };
    if (busId) where.busId = busId;
    if (driverId) where.driverId = driverId;

    const trip = await prisma.trip.findFirst({
      where,
      include: { bus: true, driver: { include: { user: true } }, route: { include: { stops: { include: { stop: true } } } } },
      orderBy: { actualDeparture: 'desc' },
    });
    
    ResponseHandler.success(res, trip);
  } catch (e) { next(e); }
});

router.post('/start-active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busId, driverId, routeId } = req.body;
    if (!busId || !driverId || !routeId) throw new Error('Missing required fields');

    // Check if there is already an active trip
    let trip = await prisma.trip.findFirst({
      where: { busId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
    });

    if (!trip) {
      // Find a scheduled trip for today
      trip = await prisma.trip.findFirst({
        where: { busId, status: 'SCHEDULED' },
        orderBy: { departureTime: 'asc' },
      });

      if (trip) {
        trip = await prisma.trip.update({
          where: { id: trip.id },
          data: { status: 'IN_PROGRESS', actualDeparture: new Date(), driverId, routeId },
        });
      } else {
        // Create an ad-hoc trip
        trip = await prisma.trip.create({
          data: {
            tripNumber: Math.floor(Math.random() * 10000),
            departureTime: new Date(),
            arrivalTime: new Date(Date.now() + 3600000),
            actualDeparture: new Date(),
            status: 'IN_PROGRESS',
            busId,
            driverId,
            routeId,
          }
        });
      }
    }

    ResponseHandler.success(res, trip, 'Trip started successfully');
  } catch (e) { next(e); }
});

router.post('/pause-active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busId } = req.body;
    if (!busId) throw new Error('Missing busId');

    const trips = await prisma.trip.findMany({
      where: { busId, status: 'IN_PROGRESS' },
    });

    for (const trip of trips) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'PAUSED' },
      });
    }

    ResponseHandler.success(res, null, 'Trip paused successfully');
  } catch (e) { next(e); }
});

router.post('/resume-active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busId } = req.body;
    if (!busId) throw new Error('Missing busId');

    const trips = await prisma.trip.findMany({
      where: { busId, status: 'PAUSED' },
    });

    for (const trip of trips) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    ResponseHandler.success(res, null, 'Trip resumed successfully');
  } catch (e) { next(e); }
});

router.post('/end-active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busId } = req.body;
    if (!busId) throw new Error('Missing busId');

    const trips = await prisma.trip.findMany({
      where: { busId, status: { in: ['IN_PROGRESS', 'PAUSED'] } },
    });

    for (const trip of trips) {
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'COMPLETED', actualArrival: new Date() },
      });
    }

    ResponseHandler.success(res, null, 'Trip ended successfully');
  } catch (e) { next(e); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id as string },
      include: { bus: true, driver: { include: { user: true } }, route: { include: { stops: { include: { stop: true } } } }, schedule: true },
    });
    ResponseHandler.success(res, trip);
  } catch (e) { next(e); }
});

router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const data: any = { status };
    if (status === 'IN_PROGRESS') data.actualDeparture = new Date();
    if (status === 'COMPLETED') data.actualArrival = new Date();
    const trip = await prisma.trip.update({ where: { id: req.params.id as string }, data });
    ResponseHandler.success(res, trip, 'Trip status updated');
  } catch (e) { next(e); }
});

export default router;
