import { Router, Request, Response, NextFunction } from 'express';
import { SchedulingEngine, DemandPredictor } from '../algorithms/scheduler';
import prisma from '../config/database';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.schedule.findMany({
        where, skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        orderBy: { date: 'desc' },
        include: { _count: { select: { trips: true } } },
      }),
      prisma.schedule.count({ where }),
    ]);
    ResponseHandler.paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { next(e); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id },
      include: {
        trips: {
          orderBy: { tripNumber: 'asc' },
          include: {
            bus: { select: { busNumber: true } },
            driver: { select: { employeeId: true, user: { select: { firstName: true, lastName: true } } } },
            route: { select: { routeNumber: true, name: true, source: true, destination: true } },
          },
        },
      },
    });
    ResponseHandler.success(res, schedule);
  } catch (e) { next(e); }
});

router.post('/generate', authorize('SUPER_ADMIN', 'ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, depotId, maxDriverHours, maxTripsPerBus, breakDuration } = req.body;
    const engine = new SchedulingEngine({
      date: new Date(date || new Date()),
      depotId,
      maxDriverHours: maxDriverHours || 8,
      maxTripsPerBus: maxTripsPerBus || 12,
      breakDuration: breakDuration || 30,
    });
    const schedule = await engine.generateSchedule();
    ResponseHandler.created(res, schedule, 'Schedule generated successfully');
  } catch (e) { next(e); }
});

router.patch('/:id/publish', authorize('SUPER_ADMIN', 'ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schedule = await prisma.schedule.update({ where: { id: req.params.id }, data: { status: 'PUBLISHED' } });
    ResponseHandler.success(res, schedule, 'Schedule published');
  } catch (e) { next(e); }
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.trip.deleteMany({ where: { scheduleId: req.params.id } });
    await prisma.schedule.delete({ where: { id: req.params.id } });
    ResponseHandler.success(res, null, 'Schedule deleted');
  } catch (e) { next(e); }
});

router.post('/predict-demand', authorize('SUPER_ADMIN', 'ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { routeId, date } = req.body;
    const predictions = DemandPredictor.predict({ routeId, date: new Date(date || new Date()) });
    ResponseHandler.success(res, predictions, 'Demand prediction generated');
  } catch (e) { next(e); }
});

export default router;
