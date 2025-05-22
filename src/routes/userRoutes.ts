import { Router } from 'express';
import { UserController } from '@/controllers';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

/**
 * @route POST /api/auth/register
 * @description Đăng ký tài khoản mới
 * @access Public
 */
router.post('/register', userController.register);

/**
 * @route POST /api/auth/login
 * @description Đăng nhập tài khoản
 * @access Public
 */
router.post('/login', userController.login);

/**
 * @route GET /api/users/profile
 * @description Lấy thông tin cá nhân
 * @access Private
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route PATCH /api/users/profile
 * @description Cập nhật thông tin cá nhân
 * @access Private
 */
router.patch('/profile', authenticate, userController.updateProfile);

/**
 * @route PATCH /api/users/change-password
 * @description Đổi mật khẩu
 * @access Private
 */
router.patch('/change-password', authenticate, userController.changePassword);

export default router; 