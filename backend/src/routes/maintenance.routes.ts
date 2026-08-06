import { Router, Request, Response, NextFunction } from 'express';
import { MaintenanceService } from '../services/operations.service';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await MaintenanceService.getAll(req.query as any); ResponseHandler.paginated(res, r.data, r.total, r.page, r.limit); } catch (e) { next(e); }
});

router.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await MaintenanceService.getUpcoming(Number(req.query.days) || 7)); } catch (e) { next(e); }
});

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEPOT_MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.created(res, await MaintenanceService.create(req.body)); } catch (e) { next(e); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DEPOT_MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await MaintenanceService.update(req.params.id, req.body), 'Updated'); } catch (e) { next(e); }
});

export default router;
