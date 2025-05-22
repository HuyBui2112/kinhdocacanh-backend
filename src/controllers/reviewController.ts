import { Request, Response } from 'express';
import { Review } from '@/models';
import { authenticate } from '@/middlewares/auth.middleware';
import mongoose from 'mongoose';

/**
 * @class ReviewController
 * @description Controller xử lý các request liên quan đến đánh giá sản phẩm
 */
class ReviewController {
    /**
     * @method createReview
     * @description Tạo đánh giá mới cho sản phẩm
     * @route POST /api/reviews
     * @middleware authenticate
     */
    static async createReview(req: Request, res: Response) {
        try {
            const { productId, rating, comment } = req.body;
            const userId = (req as any).user._id;

            if (!productId || !rating || !comment) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ thông tin'
                });
            }

            const review = await Review.createReview(
                userId,
                productId,
                Number(rating),
                comment
            );

            res.status(201).json({
                success: true,
                data: review
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method updateReview
     * @description Cập nhật đánh giá
     * @route PUT /api/reviews/:id
     * @middleware authenticate
     */
    static async updateReview(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { rating, comment } = req.body;
            const userId = (req as any).user._id;

            if (!rating || !comment) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ thông tin'
                });
            }

            const updatedReview = await Review.updateReview(
                id,
                userId,
                Number(rating),
                comment
            );

            if (!updatedReview) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy đánh giá'
                });
            }

            res.status(200).json({
                success: true,
                data: updatedReview
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method deleteReview
     * @description Xóa đánh giá
     * @route DELETE /api/reviews/:id
     * @middleware authenticate
     */
    static async deleteReview(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user._id;
            
            // Thêm log để debug
            console.log('Review ID:', id);
            console.log('User ID from token:', userId);
            console.log('User ID type:', typeof userId, userId instanceof mongoose.Types.ObjectId);

            await Review.deleteReview(id, userId);

            res.status(200).json({
                success: true,
                message: 'Xóa đánh giá thành công'
            });
        } catch (error: any) {
            console.error('Error deleting review:', error.message);
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method getProductReviews
     * @description Lấy danh sách đánh giá của sản phẩm
     * @route GET /api/products/:productId/reviews
     */
    static async getProductReviews(req: Request, res: Response) {
        try {
            const { productId } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const { reviews, total } = await Review.getProductReviews(
                productId,
                Number(page),
                Number(limit)
            );

            res.status(200).json({
                success: true,
                data: {
                    reviews,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }
}

export default ReviewController; 