import { Router, Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/operations.service';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { 
    if (req.user?.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
      if (driver) {
        req.query.driverId = driver.id;
      }
    }
    const r = await AttendanceService.getAll(req.query as any); 
    ResponseHandler.paginated(res, r.data, r.total, r.page, r.limit); 
  } catch (e) { next(e); }
});

router.post('/check-in', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let driverId = req.body.driverId;
    // If the logged in user is a driver checking themselves in
    if (!driverId && req.user?.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
      if (!driver) throw new Error('Driver profile not found');
      driverId = driver.id;
    }
    ResponseHandler.created(res, await AttendanceService.checkIn(driverId, req.body.shift)); 
  } catch (e) { next(e); }
});

router.post('/check-out', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let driverId = req.body.driverId;
    if (!driverId && req.user?.role === 'DRIVER') {
      const driver = await prisma.driver.findUnique({ where: { userId: req.user.userId } });
      if (!driver) throw new Error('Driver profile not found');
      driverId = driver.id;
    }
    ResponseHandler.success(res, await AttendanceService.checkOut(driverId), 'Checked out'); 
  } catch (e) { next(e); }
});

export default router;
