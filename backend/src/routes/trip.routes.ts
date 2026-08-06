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

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
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
    const trip = await prisma.trip.update({ where: { id: req.params.id }, data });
    ResponseHandler.success(res, trip, 'Trip status updated');
  } catch (e) { next(e); }
});

export default router;
