import prisma from '../config/database';
import { AppError } from '../utils/errors';

export class StudentService {
  static async getAll(params: {
    page?: number | string; limit?: number | string; search?: string;
  }) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const { search } = params;
    const where: any = {};

    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.studentProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          route: true,
          assignedBus: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.studentProfile.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateAssignment(id: string, data: { routeId: string | null; assignedBusId: string | null; boardingPoint: string | null }) {
    const student = await prisma.studentProfile.findUnique({ where: { id } });
    if (!student) throw AppError.notFound('Student not found');

    return prisma.studentProfile.update({
      where: { id },
      data: {
        routeId: data.routeId,
        assignedBusId: data.assignedBusId,
        boardingPoint: data.boardingPoint || student.boardingPoint,
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        route: true,
        assignedBus: true,
      }
    });
  }
}
