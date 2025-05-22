import express from "express";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  updateCart,
} from "@/controllers/cartController";
import { authenticate } from "@/middlewares/auth.middleware";

const router = express.Router();

// Tất cả các route dưới đây đều yêu cầu đăng nhập
router.use(authenticate);

/**
 * @route   GET /api/v1/cart
 * @desc    Lấy giỏ hàng của người dùng hiện tại
 * @access  Private
 */
router.get("/", getCart);

/**
 * @route   POST /api/v1/cart/items
 * @desc    Thêm sản phẩm vào giỏ hàng
 * @access  Private
 */
router.post("/items", addItemToCart);

/**
 * @route   PUT /api/v1/cart
 * @desc    Cập nhật toàn bộ giỏ hàng từ client
 * @access  Private
 */
router.put("/", updateCart);

/**
 * @route   PUT /api/v1/cart/items/:productId
 * @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
 * @access  Private
 */
router.put("/items/:productId", updateCartItem);

/**
 * @route   DELETE /api/v1/cart/items/:productId
 * @desc    Xóa một sản phẩm khỏi giỏ hàng
 * @access  Private
 */
router.delete("/items/:productId", removeCartItem);

/**
 * @route   DELETE /api/v1/cart
 * @desc    Xóa toàn bộ sản phẩm trong giỏ hàng
 * @access  Private
 */
router.delete("/", clearCart);

export default router; 