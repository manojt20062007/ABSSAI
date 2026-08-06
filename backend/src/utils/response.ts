import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: Array<{ field?: string; message: string }>;
}

export class ResponseHandler {
  static success<T>(res: Response, data: T, message = 'Success', statusCode = 200, meta?: ApiResponse['meta']) {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Created successfully') {
    return this.success(res, data, message, 201);
  }

  static error(res: Response, message: string, statusCode = 500, errors?: ApiResponse['errors']) {
    const response: ApiResponse = {
      success: false,
      message,
    };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static notFound(res: Response, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return this.error(res, message, 403);
  }

  static badRequest(res: Response, message: string, errors?: ApiResponse['errors']) {
    return this.error(res, message, 400, errors);
  }

  static paginated<T>(res: Response, data: T[], total: number, page: number, limit: number, message = 'Success') {
    return this.success(res, data, message, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
}
