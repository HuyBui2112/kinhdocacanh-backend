import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '@/models';
import { AppError, asyncHandler } from './error.middleware';

/**
 * @interface DecodedToken
 * @description Interface cho JWT payload sau khi được decode
 */
interface DecodedToken {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * @interface AuthRequest
 * @description Interface mở rộng Request để lưu thông tin user đã xác thực
 */
export interface AuthRequest extends Request {
  user?: any;
}

/**
 * @middleware authenticate
 * @description Xác thực người dùng dựa trên JWT token
 * 
 * Middleware này sẽ:
 * 1. Kiểm tra token trong header Authorization
 * 2. Verify token bằng JWT
 * 3. Tìm user tương ứng trong database
 * 4. Thêm thông tin user vào request.user
 * 
 * @throws {AppError} 401 - Không có token
 * @throws {AppError} 401 - Token không hợp lệ
 * @throws {AppError} 401 - Người dùng không tồn tại
 */
export const authenticate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1) Lấy token và kiểm tra xem nó có tồn tại không
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Bạn chưa đăng nhập! Vui lòng đăng nhập để truy cập.', 401));
    }

    try {
      // 2) Xác minh token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_key'
      ) as DecodedToken;

      // 3) Kiểm tra xem người dùng vẫn tồn tại không
      const currentUser = await UserModel.findById(decoded.id);
      if (!currentUser) {
        return next(
          new AppError('Người dùng không tồn tại hoặc đã bị xóa.', 401)
        );
      }

      // 4) Thêm thông tin người dùng vào request
      req.user = currentUser;
      
      // Log để debug
      console.log('User from token:', {
        _id: req.user._id,
        _idString: req.user._id.toString(),
        decodedId: decoded.id,
        idMatch: req.user._id.toString() === decoded.id
      });
      
      next();
    } catch (error) {
      return next(new AppError('Token không hợp lệ hoặc đã hết hạn! Vui lòng đăng nhập lại.', 401));
    }
  }
);

/**
 * @middleware isOwner
 * @description Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu của tài nguyên không
 * @param {string} paramName - Tên tham số chứa userId trong request.params (mặc định là 'id')
 * 
 * Middleware này phải được sử dụng sau middleware authenticate
 * 
 * @throws {AppError} 403 - Không có quyền truy cập vào tài nguyên này
 */
export const isOwner = (paramName: string = 'id') => {
  return asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Kiểm tra nếu ID trong params khớp với ID người dùng hiện tại
    if (req.user && req.user._id.toString() === req.params[paramName]) {
      next();
    } else {
      return next(
        new AppError('Bạn không có quyền truy cập vào tài nguyên này.', 403)
      );
    }
  });
};

/**
 * @middleware requirePassword
 * @description Kiểm tra xem request có chứa mật khẩu không
 * 
 * @throws {AppError} 400 - Vui lòng cung cấp mật khẩu hiện tại của bạn
 */
export const requirePassword = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.body.currentPassword) {
      return next(new AppError('Vui lòng cung cấp mật khẩu hiện tại của bạn để thực hiện thao tác này.', 400));
    }
    next();
  }
); 