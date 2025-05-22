import { Router } from 'express';
import { ReviewController } from '@/controllers';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();

/**
 * @route POST /api/reviews
 * @description Tạo đánh giá mới cho sản phẩm
 * @access Private
 */
router.post('/', authenticate, ReviewController.createReview);

/**
 * @route PUT /api/reviews/:id
 * @description Cập nhật đánh giá
 * @access Private
 */
router.put('/:id', authenticate, ReviewController.updateReview);

/**
 * @route DELETE /api/reviews/:id
 * @description Xóa đánh giá
 * @access Private
 */
router.delete('/:id', authenticate, ReviewController.deleteReview);

/**
 * @route GET /api/products/:productId/reviews
 * @description Lấy danh sách đánh giá của sản phẩm
 * @access Public
 */
router.get('/products/:productId/reviews', ReviewController.getProductReviews);

export default router; 