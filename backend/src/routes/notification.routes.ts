import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.userId },
        skip: (Number(page) - 1) * Number(limit), take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId: req.user!.userId } }),
    ]);
    ResponseHandler.paginated(res, data, total, Number(page), Number(limit));
  } catch (e) { next(e); }
});

router.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user!.userId, isRead: false } });
    ResponseHandler.success(res, { count });
  } catch (e) { next(e); }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id as string }, data: { isRead: true } });
    ResponseHandler.success(res, null, 'Marked as read');
  } catch (e) { next(e); }
});

router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.userId, isRead: false }, data: { isRead: true } });
    ResponseHandler.success(res, null, 'All marked as read');
  } catch (e) { next(e); }
});

export default router;
