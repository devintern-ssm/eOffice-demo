import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Application error with an HTTP status code and a stable code string. */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  static badRequest(msg: string, details?: unknown) { return new ApiError(400, msg, 'BAD_REQUEST', details); }
  static unauthorized(msg = 'Unauthorized') { return new ApiError(401, msg, 'UNAUTHORIZED'); }
  static forbidden(msg = 'Forbidden') { return new ApiError(403, msg, 'FORBIDDEN'); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg, 'NOT_FOUND'); }
  static conflict(msg: string) { return new ApiError(409, msg, 'CONFLICT'); }
}

/** Wrap an async route handler so thrown/rejected errors reach the error middleware. */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
