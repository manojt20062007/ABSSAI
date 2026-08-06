import { Router, Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await DashboardService.getStats()); } catch (e) { next(e); }
});

router.get('/activities', async (req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await DashboardService.getRecentActivities(Number(req.query.limit) || 20)); } catch (e) { next(e); }
});

router.get('/charts', async (_req: Request, res: Response, next: NextFunction) => {
  try { ResponseHandler.success(res, await DashboardService.getChartData()); } catch (e) { next(e); }
});

export default router;
