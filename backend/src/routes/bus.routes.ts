import { Router, Request, Response, NextFunction } from 'express';
import { BusService } from '../services/bus.service';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BusService.getAll(req.query as any);
    ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) { next(error); }
});

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await BusService.getStats();
    ResponseHandler.success(res, stats);
  } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bus = await BusService.getById(req.params.id as string);
    ResponseHandler.success(res, bus);
  } catch (error) { next(error); }
});

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'DEPOT_MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bus = await BusService.create(req.body);
    ResponseHandler.created(res, bus);
  } catch (error) { next(error); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'DEPOT_MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bus = await BusService.update(req.params.id as string, req.body);
    ResponseHandler.success(res, bus, 'Bus updated');
  } catch (error) { next(error); }
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await BusService.delete(req.params.id as string);
    ResponseHandler.success(res, null, 'Bus deleted');
  } catch (error) { next(error); }
});

export default router;
