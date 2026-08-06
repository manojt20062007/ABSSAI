import prisma from '../config/database';
import { AppError } from '../utils/errors';

export class RouteService {
  static async getAll(params: {
    page?: number; limit?: number; search?: string;
    isActive?: boolean; sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, search, isActive, sortBy = 'routeNumber', sortOrder = 'asc' } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { routeNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      prisma.route.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
      }),
      prisma.route.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getById(id: string) {
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        stops: { include: { stop: true }, orderBy: { sequence: 'asc' } },
        trips: { take: 10, orderBy: { departureTime: 'desc' } },
      },
    });
    if (!route) throw AppError.notFound('Route not found');
    return route;
  }

  static async create(data: any) {
    const { stops, ...routeData } = data;
    return prisma.route.create({
      data: {
        ...routeData,
        stops: stops ? { create: stops } : undefined,
      },
      include: { stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
    });
  }

  static async update(id: string, data: any) {
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) throw AppError.notFound('Route not found');

    const { stops, ...routeData } = data;

    if (stops) {
      await prisma.routeStop.deleteMany({ where: { routeId: id } });
      return prisma.route.update({
        where: { id },
        data: { ...routeData, stops: { create: stops } },
        include: { stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
      });
    }

    return prisma.route.update({
      where: { id }, data: routeData,
      include: { stops: { include: { stop: true }, orderBy: { sequence: 'asc' } } },
    });
  }

  static async delete(id: string) {
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) throw AppError.notFound('Route not found');
    return prisma.route.delete({ where: { id } });
  }
}

export class StopService {
  static async getAll(params: {
    page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc';
  }) {
    const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc' } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { nearbyLandmark: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.busStop.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sortBy]: sortOrder } }),
      prisma.busStop.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getById(id: string) {
    const stop = await prisma.busStop.findUnique({
      where: { id },
      include: { routeStops: { include: { route: { select: { routeNumber: true, name: true } } } } },
    });
    if (!stop) throw AppError.notFound('Stop not found');
    return stop;
  }

  static async create(data: any) { return prisma.busStop.create({ data }); }
  static async update(id: string, data: any) {
    const stop = await prisma.busStop.findUnique({ where: { id } });
    if (!stop) throw AppError.notFound('Stop not found');
    return prisma.busStop.update({ where: { id }, data });
  }
  static async delete(id: string) {
    const stop = await prisma.busStop.findUnique({ where: { id } });
    if (!stop) throw AppError.notFound('Stop not found');
    return prisma.busStop.delete({ where: { id } });
  }
  static async getNearby(lat: number, lng: number, radiusKm: number = 1) {
    const allStops = await prisma.busStop.findMany({ where: { isActive: true } });
    return allStops.filter((stop) => {
      const d = Math.sqrt(Math.pow(stop.latitude - lat, 2) + Math.pow(stop.longitude - lng, 2)) * 111;
      return d <= radiusKm;
    }).sort((a, b) => {
      const da = Math.sqrt(Math.pow(a.latitude - lat, 2) + Math.pow(a.longitude - lng, 2));
      const db = Math.sqrt(Math.pow(b.latitude - lat, 2) + Math.pow(b.longitude - lng, 2));
      return da - db;
    });
  }
}
