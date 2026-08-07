import prisma from '../config/database';
import { AppError } from '../utils/errors';

export class BusService {
  static async getAll(params: any) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const { search, status, depotId, fuelType, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { busNumber: { contains: search, mode: 'insensitive' } },
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (depotId) where.depotId = depotId;
    if (fuelType) where.fuelType = fuelType;

    const [data, total] = await Promise.all([
      prisma.bus.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { 
          depot: { select: { id: true, name: true, code: true } },
          route: { select: { id: true, name: true, routeNumber: true } },
          currentDriver: { select: { id: true, user: { select: { name: true } } } }
        },
      }),
      prisma.bus.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getById(id: string) {
    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        depot: true,
        route: true,
        currentDriver: { include: { user: true } },
        trips: { take: 10, orderBy: { departureTime: 'desc' } },
        maintenanceRecords: { take: 5, orderBy: { scheduledDate: 'desc' } },
        fuelRecords: { take: 5, orderBy: { date: 'desc' } },
      },
    });
    if (!bus) throw AppError.notFound('Bus not found');
    return bus;
  }

  static async create(data: any) {
    return prisma.bus.create({ 
      data, 
      include: { 
        depot: { select: { id: true, name: true } },
        route: { select: { id: true, name: true, routeNumber: true } },
        currentDriver: { select: { id: true, user: { select: { name: true } } } }
      } 
    });
  }

  static async update(id: string, data: any) {
    const bus = await prisma.bus.findUnique({ where: { id } });
    if (!bus) throw AppError.notFound('Bus not found');
    return prisma.bus.update({ 
      where: { id }, 
      data, 
      include: { 
        depot: { select: { id: true, name: true } },
        route: { select: { id: true, name: true, routeNumber: true } },
        currentDriver: { select: { id: true, user: { select: { name: true } } } }
      } 
    });
  }

  static async delete(id: string) {
    const bus = await prisma.bus.findUnique({ where: { id } });
    if (!bus) throw AppError.notFound('Bus not found');
    return prisma.bus.delete({ where: { id } });
  }

  static async getStats() {
    const [total, active, inactive, maintenance, breakdown] = await Promise.all([
      prisma.bus.count(),
      prisma.bus.count({ where: { status: 'ACTIVE' } }),
      prisma.bus.count({ where: { status: 'INACTIVE' } }),
      prisma.bus.count({ where: { status: 'MAINTENANCE' } }),
      prisma.bus.count({ where: { status: 'BREAKDOWN' } }),
    ]);
    return { total, active, inactive, maintenance, breakdown };
  }
}
