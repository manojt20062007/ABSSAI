import { Router, Request, Response, NextFunction } from 'express';
import { DepotService } from '../services/depot.service';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { const r = await DepotService.getAll(req.query as any); ResponseHandler.paginated(res, r.data, r.total, r.page, r.limit); } catch (e) { next(e); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await DepotService.getById(req.params.id as string)); } catch (e) { next(e); }
});

router.post('/', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.created(res, await DepotService.create(req.body)); } catch (e) { next(e); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DEPOT_MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await DepotService.update(req.params.id as string, req.body), 'Depot updated'); } catch (e) { next(e); }
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try { await DepotService.delete(req.params.id as string); ResponseHandler.success(res, null, 'Depot deleted'); } catch (e) { next(e); }
});

export default router;
