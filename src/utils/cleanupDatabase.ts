import mongoose from "mongoose";
import { Cart, CartModel } from "@/models";
import dotenv from "dotenv";

// Load biến môi trường từ .env
dotenv.config();

/**
 * @function cleanupInvalidCarts
 * @description Dọn dẹp các giỏ hàng không hợp lệ trong database
 */
export const cleanupInvalidCarts = async (): Promise<void> => {
  try {
    // Lấy MONGODB_URI từ biến môi trường
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/kinhdo-cacanh";

    // Kết nối đến MongoDB
    await mongoose.connect(mongoURI);
    console.log("Đã kết nối đến MongoDB");

    // Xóa các cart với userId null hoặc undefined
    const deletedNullCount = await Cart.removeNullUserIdCarts();
    console.log(`Đã xóa ${deletedNullCount} giỏ hàng không hợp lệ (userId null hoặc undefined)`);

    // Xóa các cart trống (không có sản phẩm nào)
    const result = await CartModel.deleteMany({ 'items.0': { $exists: false } });
    console.log(`Đã xóa ${result.deletedCount} giỏ hàng trống (không có sản phẩm nào)`);

    // Ngắt kết nối
    await mongoose.disconnect();
    console.log("Đã ngắt kết nối MongoDB");
  } catch (error) {
    console.error("Lỗi khi dọn dẹp database:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Nếu gọi trực tiếp file này
if (require.main === module) {
  cleanupInvalidCarts()
    .then(() => {
      console.log("Hoàn tất dọn dẹp database");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Lỗi:", error);
      process.exit(1);
    });
} 