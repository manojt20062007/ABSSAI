import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ResponseHandler } from '../utils/response';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SCHEDULER', 'TRANSPORT_ADMIN', 'DRIVER', 'STUDENT']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.register(req.body);
    ResponseHandler.created(res, result, 'Registration successful');
  } catch (error) { next(error); }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    ResponseHandler.success(res, result, 'Login successful');
  } catch (error) { next(error); }
});

router.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refreshToken(refreshToken);
    ResponseHandler.success(res, tokens, 'Token refreshed');
  } catch (error) { next(error); }
});

router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const result = await AuthService.verifyOTP(email, otp);
    ResponseHandler.success(res, result);
  } catch (error) { next(error); }
});

router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    ResponseHandler.success(res, result);
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await AuthService.resetPassword(email, otp, newPassword);
    ResponseHandler.success(res, result);
  } catch (error) { next(error); }
});

router.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.logout(req.user!.userId);
    ResponseHandler.success(res, result);
  } catch (error) { next(error); }
});

router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await AuthService.getProfile(req.user!.userId);
    ResponseHandler.success(res, profile);
  } catch (error) { next(error); }
});

router.put('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.updateProfile(req.user!.userId, req.body);
    ResponseHandler.success(res, result, 'Profile updated');
  } catch (error) { next(error); }
});

export default router;
