import { Request, Response, NextFunction } from 'express';

// Định nghĩa interface cho lỗi HTTP
export interface HttpError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

// Class xử lý lỗi HTTP
export class AppError extends Error implements HttpError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware xử lý lỗi
export const errorHandler = (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Xử lý lỗi trong môi trường development
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } 
  // Xử lý lỗi trong môi trường production
  else {
    // Lỗi operational: gửi thông báo lỗi cho client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } 
    // Lỗi programming hoặc lỗi không xác định: không gửi chi tiết lỗi cho client
    else {
      console.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Đã xảy ra lỗi! Vui lòng thử lại sau.'
      });
    }
  }
};

// Middleware xử lý lỗi 404
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Không tìm thấy - ${req.originalUrl}`, 404);
  next(error);
};

// Middleware xử lý lỗi async
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}; 