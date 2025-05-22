import { Router } from 'express';
import { ProductController } from '@/controllers';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @route POST /api/products
 * @description Tạo sản phẩm mới
 * @access Private
 */
router.post('/', authenticate, ProductController.createProduct);

/**
 * @route GET /api/products
 * @description Lấy danh sách sản phẩm với phân trang và bộ lọc
 * @access Public
 */
router.get('/', ProductController.getProducts);

/**
 * @route GET /api/products/search
 * @description Tìm kiếm sản phẩm theo tên
 * @access Public
 */
router.get('/search', ProductController.searchProducts);

/**
 * @route GET /api/products/:id
 * @description Lấy chi tiết sản phẩm theo ID
 * @access Public
 */
router.get('/:id', ProductController.getProductById);

export default router; 