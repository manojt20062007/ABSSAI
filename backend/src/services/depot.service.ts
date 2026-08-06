import prisma from '../config/database';
import { AppError } from '../utils/errors';

export class DepotService {
  static async getAll(params: {
    page?: number | string; limit?: number | string; search?: string;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const { search, sortBy = 'name', sortOrder = 'asc' } = params;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.depot.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { buses: true, drivers: true } } },
      }),
      prisma.depot.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getById(id: string) {
    const depot = await prisma.depot.findUnique({
      where: { id },
      include: {
        buses: { select: { id: true, busNumber: true, status: true, model: true } },
        drivers: { select: { id: true, employeeId: true, shift: true, isAvailable: true, user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { buses: true, drivers: true } },
      },
    });
    if (!depot) throw AppError.notFound('Depot not found');
    return depot;
  }

  static async create(data: any) {
    return prisma.depot.create({ data, include: { _count: { select: { buses: true, drivers: true } } } });
  }

  static async update(id: string, data: any) {
    const depot = await prisma.depot.findUnique({ where: { id } });
    if (!depot) throw AppError.notFound('Depot not found');
    return prisma.depot.update({ where: { id }, data });
  }

  static async delete(id: string) {
    const depot = await prisma.depot.findUnique({ where: { id } });
    if (!depot) throw AppError.notFound('Depot not found');
    return prisma.depot.delete({ where: { id } });
  }
}
