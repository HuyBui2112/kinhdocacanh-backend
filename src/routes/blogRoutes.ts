import { Router } from 'express';
import { BlogController } from '@/controllers';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @route GET /api/blogs
 * @description Lấy danh sách bài viết với phân trang và bộ lọc
 * @access Public
 */
router.get('/', BlogController.getBlogs);

/**
 * @route GET /api/blogs/:slug
 * @description Lấy chi tiết bài viết theo slug
 * @access Public
 */
router.get('/:slug', BlogController.getBlogBySlug);

/**
 * @route POST /api/blogs
 * @description Tạo bài viết mới
 * @access Private
 */
router.post('/', authenticate, BlogController.createBlog);

/**
 * @route PUT /api/blogs/:id
 * @description Cập nhật bài viết
 * @access Private
 */
router.put('/:id', authenticate, BlogController.updateBlog);

/**
 * @route DELETE /api/blogs/:id
 * @description Xóa bài viết
 * @access Private
 */
router.delete('/:id', authenticate, BlogController.deleteBlog);

export default router; 