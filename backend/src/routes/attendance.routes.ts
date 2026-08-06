import { Router, Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/operations.service';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await AttendanceService.getAll(req.query as any); ResponseHandler.paginated(res, r.data, r.total, r.page, r.limit); } catch (e) { next(e); }
});

router.post('/check-in', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.created(res, await AttendanceService.checkIn(req.body.driverId, req.body.shift)); } catch (e) { next(e); }
});

router.post('/check-out', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await AttendanceService.checkOut(req.body.driverId), 'Checked out'); } catch (e) { next(e); }
});

export default router;
