import prisma from '../config/database';
import { AppError } from '../utils/errors';
import bcrypt from 'bcryptjs';

export class StudentService {
  static async create(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw AppError.conflict('Email already registered');

    const existingStudentId = await prisma.studentProfile.findUnique({ where: { studentId: data.studentId } });
    if (existingStudentId) throw AppError.conflict('Student ID already exists');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'STUDENT',
        otpCode,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        isActive: true,
        isVerified: true, // Auto verify since admin creates
        studentProfile: {
          create: {
            studentId: data.studentId,
            department: data.department || '',
            section: data.section || 'A',
            year: data.year || '1',
            boardingPoint: data.boardingPoint || '',
            destination: data.destination || 'College',
            validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    return user.studentProfile;
  }
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
