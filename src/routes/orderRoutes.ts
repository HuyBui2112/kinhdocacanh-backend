import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  createBuyNowOrder,
} from "@/controllers/orderController";
import { authenticate } from "@/middlewares/auth.middleware";

const router = express.Router();

// Tất cả các route dưới đây đều yêu cầu đăng nhập
router.use(authenticate);

/**
 * @route   POST /api/v1/orders
 * @desc    Tạo một đơn hàng mới
 * @access  Private
 */
router.post("/", createOrder);

/**
 * @route   POST /api/v1/orders/buy-now
 * @desc    Tạo đơn hàng trực tiếp từ một sản phẩm (Mua ngay)
 * @access  Private
 */
router.post("/buy-now", createBuyNowOrder);

/**
 * @route   GET /api/v1/orders/my-orders
 * @desc    Lấy lịch sử đơn hàng của người dùng hiện tại
 * @access  Private
 */
router.get("/my-orders", getMyOrders);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Lấy chi tiết một đơn hàng theo ID
 * @access  Private
 */
router.get("/:id", getOrderById); // Middleware isOwner đã được tích hợp trong controller getOrderById

/**
 * @route   PUT /api/v1/orders/:id/cancel
 * @desc    Hủy một đơn hàng
 * @access  Private
 */
router.put("/:id/cancel", cancelOrder);

/**
 * @route   PUT /api/v1/orders/:id/status
 * @desc    Cập nhật trạng thái đơn hàng
 * @access  Private
 * @note    API này có thể được ẩn khỏi tài liệu API client nếu không muốn client sử dụng
 */
router.put("/:id/status", updateOrderStatus);

export default router; 