import { Router, Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/driver.service';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DriverService.getAll(req.query as any);
    ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) { next(error); }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await DriverService.getStats()); } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await DriverService.getById(req.params.id as string)); } catch (error) { next(error); }
});

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEPOT_MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.created(res, await DriverService.create(req.body)); } catch (error) { next(error); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DEPOT_MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await DriverService.update(req.params.id as string, req.body), 'Driver updated'); } catch (error) { next(error); }
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try { await DriverService.delete(req.params.id as string); ResponseHandler.success(res, null, 'Driver deleted'); } catch (error) { next(error); }
});

export default router;
