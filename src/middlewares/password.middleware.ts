import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { AppError, asyncHandler } from './error.middleware';

/**
 * @middleware hashPassword
 * @description Hash mật khẩu trước khi lưu vào database
 * @param {string} path - Đường dẫn đến trường mật khẩu trong request.body
 * 
 * @throws {AppError} 400 - Mật khẩu không hợp lệ
 */
export const hashPassword = (path: string = 'password') => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let password;
    
    // Lấy mật khẩu từ path được chỉ định
    if (path.includes('.')) {
      // Ví dụ: info_auth.password
      const parts = path.split('.');
      let current: any = req.body;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) return next(); // Không có trường cần hash
        current = current[parts[i]];
      }
      
      password = current[parts[parts.length - 1]];
      
      // Không có mật khẩu để hash
      if (!password) return next();
      
      // Kiểm tra độ dài mật khẩu
      if (password.length < 6) {
        return next(new AppError('Mật khẩu phải có ít nhất 6 ký tự', 400));
      }
      
      // Hash mật khẩu
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Gán lại mật khẩu đã hash
        current[parts[parts.length - 1]] = hashedPassword;
      } catch (error) {
        return next(new AppError('Không thể xử lý mật khẩu. Vui lòng thử lại.', 500));
      }
    } else {
      // Trường hợp đơn giản: req.body.password
      password = req.body[path];
      
      // Không có mật khẩu để hash
      if (!password) return next();
      
      // Kiểm tra độ dài mật khẩu
      if (password.length < 6) {
        return next(new AppError('Mật khẩu phải có ít nhất 6 ký tự', 400));
      }
      
      // Hash mật khẩu
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Gán lại mật khẩu đã hash
        req.body[path] = hashedPassword;
      } catch (error) {
        return next(new AppError('Không thể xử lý mật khẩu. Vui lòng thử lại.', 500));
      }
    }
    
    next();
  });
};

/**
 * @middleware validatePasswordStrength
 * @description Kiểm tra độ mạnh của mật khẩu
 * @param {string} path - Đường dẫn đến trường mật khẩu trong request.body
 * 
 * @throws {AppError} 400 - Mật khẩu quá yếu
 */
export const validatePasswordStrength = (path: string = 'password') => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let password;
    
    // Lấy mật khẩu từ path được chỉ định
    if (path.includes('.')) {
      // Ví dụ: info_auth.password
      const parts = path.split('.');
      let current: any = req.body;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) return next(); // Không có trường cần kiểm tra
        current = current[parts[i]];
      }
      
      password = current[parts[parts.length - 1]];
    } else {
      // Trường hợp đơn giản: req.body.password
      password = req.body[path];
    }
    
    // Không có mật khẩu để kiểm tra
    if (!password) return next();
    
    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return next(new AppError('Mật khẩu phải có ít nhất 6 ký tự', 400));
    }
    
    // Kiểm tra độ mạnh của mật khẩu
    // - Có ít nhất 1 chữ hoa
    // - Có ít nhất 1 chữ thường
    // - Có ít nhất 1 số
    // - Có ít nhất 1 ký tự đặc biệt
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,}$/;
    
    if (!strongPasswordRegex.test(password)) {
      return next(new AppError(
        'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt',
        400
      ));
    }
    
    next();
  });
}; 