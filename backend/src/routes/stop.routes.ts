import { Router, Request, Response, NextFunction } from 'express';
import { StopService } from '../services/route.service';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await StopService.getAll(req.query as any); ResponseHandler.paginated(res, r.data, r.total, r.page, r.limit); } catch (e) { next(e); }
});

router.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius } = req.query;
    const stops = await StopService.getNearby(Number(lat), Number(lng), Number(radius) || 1);
    ResponseHandler.success(res, stops);
  } catch (e) { next(e); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await StopService.getById(req.params.id)); } catch (e) { next(e); }
});

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.created(res, await StopService.create(req.body)); } catch (e) { next(e); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await StopService.update(req.params.id, req.body), 'Stop updated'); } catch (e) { next(e); }
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try { await StopService.delete(req.params.id); ResponseHandler.success(res, null, 'Stop deleted'); } catch (e) { next(e); }
});

export default router;
