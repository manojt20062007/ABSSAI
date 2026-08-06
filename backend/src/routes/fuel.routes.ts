import { Router, Request, Response, NextFunction } from 'express';
import { FuelService } from '../services/operations.service';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await FuelService.getAll(req.query as any); ResponseHandler.paginated(res, r.data, r.total, r.page, r.limit); } catch (e) { next(e); }
});

router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await FuelService.getAnalytics(req.query.busId as string)); } catch (e) { next(e); }
});

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'TRANSPORT_ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.created(res, await FuelService.create(req.body)); } catch (e) { next(e); }
});

export default router;
