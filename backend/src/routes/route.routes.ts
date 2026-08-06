import { Router, Request, Response, NextFunction } from 'express';
import { RouteService } from '../services/route.service';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await RouteService.getAll(req.query as any);
    ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await RouteService.getById(req.params.id as string)); } catch (error) { next(error); }
});

router.post('/', authorize('SUPER_ADMIN', 'ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.created(res, await RouteService.create(req.body)); } catch (error) { next(error); }
});

router.put('/:id', authorize('SUPER_ADMIN', 'ADMIN', 'SCHEDULER'), async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await RouteService.update(req.params.id as string, req.body), 'Route updated'); } catch (error) { next(error); }
});

router.delete('/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try { await RouteService.delete(req.params.id as string); ResponseHandler.success(res, null, 'Route deleted'); } catch (error) { next(error); }
});

export default router;
