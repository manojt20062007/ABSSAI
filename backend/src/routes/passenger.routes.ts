import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { StopService } from '../services/route.service';
import { ResponseHandler } from '../utils/response';

const router = Router();

// Public routes (no auth required for passenger portal)
router.get('/routes/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
        OR: [
          { routeNumber: { contains: String(q || ''), mode: 'insensitive' } },
          { name: { contains: String(q || ''), mode: 'insensitive' } },
          { source: { contains: String(q || ''), mode: 'insensitive' } },
          { destination: { contains: String(q || ''), mode: 'insensitive' } },
        ],
      },
      include: { stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
      take: 20,
    });
    ResponseHandler.success(res, routes);
  } catch (e) { next(e); }
});

router.get('/stops/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stops = await StopService.getNearby(Number(req.query.lat), Number(req.query.lng), Number(req.query.radius) || 1);
    ResponseHandler.success(res, stops);
  } catch (e) { next(e); }
});

router.get('/buses/live', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const buses = await prisma.bus.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, busNumber: true, status: true, depotId: true },
    });
    ResponseHandler.success(res, buses);
  } catch (e) { next(e); }
});

router.get('/routes/:id/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const trips = await prisma.trip.findMany({
      where: { routeId: req.params.id as string, departureTime: { gte: today, lt: tomorrow } },
      orderBy: { departureTime: 'asc' },
      include: { bus: { select: { busNumber: true } } },
    });
    ResponseHandler.success(res, trips);
  } catch (e) { next(e); }
});

export default router;
