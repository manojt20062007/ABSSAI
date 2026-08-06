import prisma from '../config/database';
import { AppError } from '../utils/errors';

export class DriverService {
  static async getAll(params: {
    page?: number; limit?: number; search?: string;
    shift?: string; depotId?: string; isAvailable?: boolean;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, search, shift, depotId, isAvailable, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (shift) where.shift = shift;
    if (depotId) where.depotId = depotId;
    if (isAvailable !== undefined) where.isAvailable = isAvailable;

    const [data, total] = await Promise.all([
      prisma.driver.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
          depot: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.driver.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getById(id: string) {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
        depot: true,
        trips: { take: 10, orderBy: { departureTime: 'desc' }, include: { route: { select: { routeNumber: true, name: true } }, bus: { select: { busNumber: true } } } },
        attendance: { take: 30, orderBy: { date: 'desc' } },
      },
    });
    if (!driver) throw AppError.notFound('Driver not found');
    return driver;
  }

  static async create(data: any) {
    return prisma.driver.create({
      data,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  static async update(id: string, data: any) {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) throw AppError.notFound('Driver not found');
    return prisma.driver.update({
      where: { id }, data,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  static async delete(id: string) {
    const driver = await prisma.driver.findUnique({ where: { id } });
    if (!driver) throw AppError.notFound('Driver not found');
    return prisma.driver.delete({ where: { id } });
  }

  static async getStats() {
    const [total, available, onDuty, onLeave] = await Promise.all([
      prisma.driver.count(),
      prisma.driver.count({ where: { isAvailable: true } }),
      prisma.driver.count({ where: { isAvailable: false } }),
      prisma.attendance.count({ where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'ON_LEAVE' } }),
    ]);
    return { total, available, onDuty, onLeave };
  }
}
