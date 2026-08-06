import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import type { JwtPayload } from '../middleware/auth';

export class AuthService {
  static async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw AppError.conflict('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: (data.role as any) || 'PASSENGER',
        otpCode,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, isVerified: true, createdAt: true,
      },
    });

    return { user, otpCode };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.unauthorized('Invalid credentials');
    if (!user.isActive) throw AppError.forbidden('Account is deactivated');

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw AppError.unauthorized('Invalid credentials');

    const tokens = this.generateTokens({ userId: user.id, email: user.email, role: user.role });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken, lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, role: user.role, avatar: user.avatar,
        isVerified: user.isVerified,
      },
      ...tokens,
    };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || user.refreshToken !== refreshToken) {
        throw AppError.unauthorized('Invalid refresh token');
      }

      const tokens = this.generateTokens({ userId: user.id, email: user.email, role: user.role });

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch {
      throw AppError.unauthorized('Invalid refresh token');
    }
  }

  static async verifyOTP(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.notFound('User not found');
    if (user.otpCode !== otp) throw AppError.badRequest('Invalid OTP');
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw AppError.badRequest('OTP expired');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiresAt: null },
    });

    return { message: 'Email verified successfully' };
  }

  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.notFound('User not found');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    return { message: 'OTP sent to email', otpCode }; // In production, send via email
  }

  static async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.notFound('User not found');
    if (user.otpCode !== otp) throw AppError.badRequest('Invalid OTP');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, otpCode: null, otpExpiresAt: null },
    });

    return { message: 'Password reset successfully' };
  }

  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        avatar: true, role: true, isActive: true, isVerified: true,
        lastLoginAt: true, createdAt: true, driver: true,
      },
    });
    if (!user) throw AppError.notFound('User not found');
    return user;
  }

  static async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, role: true,
      },
    });
  }

  private static generateTokens(payload: JwtPayload) {
    const accessToken = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn as any });
    return { accessToken, refreshToken };
  }
}
