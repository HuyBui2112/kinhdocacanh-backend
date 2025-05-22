import { Request, Response, NextFunction } from 'express';
import { User } from '@/models';
import { AuthRequest, AppError, asyncHandler } from '@/middlewares';
import { AuthResponse, UpdateInfoUserResponse } from '@/utils/types';

/**
 * @controller UserController
 * @description Các controller xử lý request liên quan đến người dùng
 */
class UserController {
  /**
   * @method register
   * @description Đăng ký tài khoản mới
   * @route POST /api/auth/register
   * @access Public
   * 
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { info_user, info_auth } = req.body;
    
    console.log('Controller nhận email:', info_auth?.email);

    // Kiểm tra dữ liệu đầu vào
    if (!info_user || !info_auth) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin người dùng', 400));
    }

    // Kiểm tra các trường bắt buộc
    if (!info_user.username || !info_user.phone || !info_user.address) {
      return next(new AppError('Vui lòng cung cấp đầy đủ thông tin cá nhân', 400));
    }

    if (!info_auth.email || !info_auth.password) {
      return next(new AppError('Vui lòng cung cấp email và mật khẩu', 400));
    }

    try {
      console.log('Trước khi gọi User.register, email là:', info_auth?.email);
      // Đăng ký người dùng mới
      const user = await User.register(info_user, info_auth);
      
      // Tạo token
      const token = user.generateToken();

      // Tạo response
      const response: AuthResponse = {
        _id: user._id.toString(),
        email: user.info_auth.email,
        info_user: user.info_user,
        token
      };

      res.status(201).json({
        status: 'success',
        message: 'Đăng ký tài khoản thành công',
        data: response
      });
    } catch (error: any) {
      if (error.message.includes('Email đã được sử dụng')) {
        return next(new AppError('Email đã được sử dụng', 400));
      }
      next(error);
    }
  });

  /**
   * @method login
   * @description Đăng nhập tài khoản
   * @route POST /api/auth/login
   * @access Public
   * 
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Hỗ trợ cả hai loại input
    let email, password;
    
    if (req.body.info_auth) {
      // Nếu client gửi dữ liệu theo format info_auth như khi đăng ký
      email = req.body.info_auth.email;
      password = req.body.info_auth.password;
    } else {
      // Format thông thường
      email = req.body.email;
      password = req.body.password;
    }

    // Kiểm tra dữ liệu đầu vào
    if (!email || !password) {
      return next(new AppError('Vui lòng cung cấp email và mật khẩu', 400));
    }

    try {
      // Tìm user trực tiếp từ Model
      const loginResult = await User.login(email, password);
      
      if (!loginResult || !loginResult.user) {
        return next(new AppError('Email hoặc mật khẩu không chính xác', 401));
      }

      const { user, token } = loginResult;

      // Tạo response
      const response: AuthResponse = {
        _id: user._id.toString(),
        email: user.info_auth.email,
        info_user: user.info_user,
        token: token
      };

      res.status(200).json({
        status: 'success',
        message: 'Đăng nhập thành công',
        data: response
      });
    } catch (error: any) {
      return next(new AppError('Email hoặc mật khẩu không chính xác', 401));
    }
  });

  /**
   * @method getProfile
   * @description Lấy thông tin cá nhân
   * @route GET /api/users/profile
   * @access Private
   * 
   * @param {AuthRequest} req - Express request object với thông tin user
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    // Tạo response
    const response: UpdateInfoUserResponse = {
      _id: user._id.toString(),
      email: user.info_auth.email,
      info_user: user.info_user
    };

    res.status(200).json({
      status: 'success',
      data: response
    });
  });

  /**
   * @method updateProfile
   * @description Cập nhật thông tin cá nhân
   * @route PATCH /api/users/profile
   * @access Private
   * 
   * @param {AuthRequest} req - Express request object với thông tin user
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id;
    const { info_user } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!info_user) {
      return next(new AppError('Vui lòng cung cấp thông tin cần cập nhật', 400));
    }

    try {
      // Cập nhật thông tin
      const updatedUser = await User.updateUserInfo(userId, info_user);

      if (!updatedUser) {
        return next(new AppError('Không tìm thấy người dùng', 404));
      }

      // Tạo response
      const response: UpdateInfoUserResponse = {
        _id: updatedUser._id.toString(),
        email: updatedUser.info_auth.email,
        info_user: updatedUser.info_user
      };

      res.status(200).json({
        status: 'success',
        message: 'Cập nhật thông tin thành công',
        data: response
      });
    } catch (error: any) {
      if (error.message.includes('Không có thông tin nào được cập nhật')) {
        return next(new AppError('Không có thông tin nào được cập nhật', 400));
      }
      if (error.message.includes('Số điện thoại không hợp lệ')) {
        return next(new AppError('Số điện thoại không hợp lệ (phải có 10 chữ số)', 400));
      }
      next(error);
    }
  });

  /**
   * @method changePassword
   * @description Đổi mật khẩu
   * @route PATCH /api/users/change-password
   * @access Private
   * 
   * @param {AuthRequest} req - Express request object với thông tin user
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   */
  changePassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!currentPassword || !newPassword) {
      return next(new AppError('Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới', 400));
    }

    try {
      // Đổi mật khẩu
      await User.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        status: 'success',
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error: any) {
      if (error.message.includes('Mật khẩu hiện tại không chính xác')) {
        return next(new AppError('Mật khẩu hiện tại không chính xác', 400));
      }
      if (error.message.includes('Mật khẩu mới phải có ít nhất')) {
        return next(new AppError('Mật khẩu mới phải có ít nhất 6 ký tự', 400));
      }
      next(error);
    }
  });
}

// Export default class thay vì export instance
export default UserController; 