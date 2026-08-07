import { Router, Request, Response, NextFunction } from 'express';
import { StudentService } from '../services/student.service';
import { ResponseHandler } from '../utils/response';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await StudentService.getAll(req.query as any);
    ResponseHandler.paginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) { next(error); }
});

router.put('/:id/assignment', authorize('SUPER_ADMIN', 'ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { routeId, assignedBusId, boardingPoint } = req.body;
    const updated = await StudentService.updateAssignment(req.params.id as string, { routeId, assignedBusId, boardingPoint });
    ResponseHandler.success(res, updated, 'Student assignment updated successfully');
  } catch (error) { next(error); }
});

export default router;
