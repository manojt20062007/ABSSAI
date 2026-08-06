import prisma from '../config/database';
import { AppError } from '../utils/errors';

export class MaintenanceService {
  static async getAll(params: { page?: number; limit?: number; busId?: string; status?: string; type?: string }) {
    const { page = 1, limit = 10, busId, status, type } = params;
    const where: any = {};
    if (busId) where.busId = busId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { scheduledDate: 'desc' },
        include: { bus: { select: { busNumber: true, registrationNumber: true } } },
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async create(data: any) {
    return prisma.maintenanceRecord.create({ data, include: { bus: { select: { busNumber: true } } } });
  }

  static async update(id: string, data: any) {
    const record = await prisma.maintenanceRecord.findUnique({ where: { id } });
    if (!record) throw AppError.notFound('Maintenance record not found');
    if (data.status === 'COMPLETED') data.completedDate = new Date();
    return prisma.maintenanceRecord.update({ where: { id }, data });
  }

  static async getUpcoming(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return prisma.maintenanceRecord.findMany({
      where: { status: 'PENDING', scheduledDate: { lte: futureDate } },
      include: { bus: { select: { busNumber: true, registrationNumber: true } } },
      orderBy: { scheduledDate: 'asc' },
    });
  }
}

export class FuelService {
  static async getAll(params: { page?: number; limit?: number; busId?: string; dateFrom?: string; dateTo?: string }) {
    const { page = 1, limit = 10, busId, dateFrom, dateTo } = params;
    const where: any = {};
    if (busId) where.busId = busId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      prisma.fuelRecord.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { date: 'desc' },
        include: { bus: { select: { busNumber: true, registrationNumber: true } } },
      }),
      prisma.fuelRecord.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async create(data: any) {
    return prisma.fuelRecord.create({ data, include: { bus: { select: { busNumber: true } } } });
  }

  static async getAnalytics(busId?: string) {
    const where: any = {};
    if (busId) where.busId = busId;

    const result = await prisma.fuelRecord.aggregate({
      where,
      _avg: { mileage: true, costPerUnit: true },
      _sum: { totalCost: true, quantity: true },
      _count: true,
    });
    return result;
  }
}

export class AttendanceService {
  static async getAll(params: { page?: number; limit?: number; driverId?: string; date?: string; status?: string }) {
    const { page = 1, limit = 10, driverId, date, status } = params;
    const where: any = {};
    if (driverId) where.driverId = driverId;
    if (date) where.date = new Date(date);
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.attendance.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { date: 'desc' },
        include: { driver: { select: { employeeId: true, user: { select: { firstName: true, lastName: true } } } } },
      }),
      prisma.attendance.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async checkIn(driverId: string, shift: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendance.findFirst({ where: { driverId, date: today } });
    if (existing) throw AppError.conflict('Already checked in today');

    const now = new Date();
    const shiftStartHours: Record<string, number> = { MORNING: 6, AFTERNOON: 14, NIGHT: 22, SPLIT: 6 };
    const expectedStart = shiftStartHours[shift] || 6;
    const lateMinutes = Math.max(0, (now.getHours() * 60 + now.getMinutes()) - (expectedStart * 60));

    return prisma.attendance.create({
      data: {
        driverId, date: today, checkIn: now, shift: shift as any,
        status: lateMinutes > 15 ? 'LATE' : 'PRESENT', lateMinutes,
      },
    });
  }

  static async checkOut(driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await prisma.attendance.findFirst({ where: { driverId, date: today } });
    if (!attendance) throw AppError.notFound('No check-in found for today');
    return prisma.attendance.update({ where: { id: attendance.id }, data: { checkOut: new Date() } });
  }
}
