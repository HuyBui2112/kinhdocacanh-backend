import { Response, NextFunction } from "express";
import {
  Order,
  OrderModel,
  Cart,
  CartModel,
  ProductModel,
  IOrder,
  OrderStatus,
  IShippingAddress,
} from "@/models";
import { AppError, asyncHandler } from "@/middlewares";
import { AuthRequest } from "@/middlewares/auth.middleware";
import mongoose from "mongoose";

/**
 * @controller createOrder
 * @description Tạo đơn hàng mới từ giỏ hàng của người dùng.
 * @route POST /api/v1/orders
 * @access Private
 * @body {IShippingAddress} shippingAddress - Thông tin giao hàng
 * @body {string} paymentMethod - Phương thức thanh toán (ví dụ: 'COD')
 */
export const createOrder = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { shippingAddress, paymentMethod } = req.body as {
      shippingAddress: IShippingAddress;
      paymentMethod?: string;
    };

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }

    // Đảm bảo userId là string và không null
    const userIdStr = userId.toString();

    if (!shippingAddress) {
      return next(new AppError("Vui lòng cung cấp thông tin giao hàng.", 400));
    }
    if (
      !shippingAddress.fullname ||
      !shippingAddress.address ||
      !shippingAddress.phone
    ) {
      return next(
        new AppError(
          "Thông tin giao hàng không đầy đủ (họ tên, địa chỉ, số điện thoại).",
          400
        )
      );
    }
    // Validate phone format
    if (!/^\d{10}$/.test(shippingAddress.phone)) {
      return next(
        new AppError("Số điện thoại giao hàng không hợp lệ (phải có 10 chữ số).", 400)
      );
    }

    // Tìm giỏ hàng của người dùng
    const cart = await CartModel.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return next(new AppError("Giỏ hàng của bạn đang trống.", 400));
    }

    // Kiểm tra tồn kho của từng sản phẩm
    const orderItems = [];

    // Sử dụng vòng lặp for...of để xử lý bất đồng bộ đúng cách khi kiểm tra product
    for (const item of cart.items) {
      const product = await ProductModel.findById(item.productId);
      if (!product) {
        return next(
          new AppError(
            `Sản phẩm với ID ${item.productId} không còn tồn tại. Vui lòng xóa khỏi giỏ hàng và thử lại.`,
            404
          )
        );
      }
      if (product.pd_stock < item.quantity) {
        return next(
          new AppError(
            `Sản phẩm '${product.pd_name}' không đủ số lượng tồn kho (cần ${item.quantity}, còn ${product.pd_stock}).`,
            400
          )
        );
      }
      // Thêm item vào orderItems
      orderItems.push({
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price, // Giá đã lưu trong giỏ hàng tại thời điểm thêm
        quantity: item.quantity,
      });
    }

    // Sử dụng phương thức calculateTotal để tính tổng tiền
    const totalPrice = Cart.calculateTotal(cart.items);

    // Tạo đơn hàng
    const orderData: Partial<IOrder> = {
      userId,
      items: orderItems as any,
      shippingAddress,
      totalPrice,
      status: OrderStatus.PENDING, // Mặc định là chờ xử lý
      orderDate: new Date(),
    };
    if (paymentMethod) {
      orderData.paymentMethod = paymentMethod;
    }

    // Sử dụng class Order để tạo đơn hàng
    const order = await Order.createOrder(orderData);

    // Cập nhật số lượng tồn kho của sản phẩm (sau khi tạo đơn hàng thành công)
    // Dùng session và transaction để đảm bảo tính nhất quán nếu có lỗi xảy ra
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const item of order.items) {
        await ProductModel.findByIdAndUpdate(
          item.productId,
          { $inc: { pd_stock: -item.quantity } },
          { session } // Quan trọng: sử dụng session cho hoạt động này
        );
      }
      // Xóa giỏ hàng sau khi đặt hàng thành công
      if (userId) {
        // Đảm bảo userId không null trước khi xóa giỏ hàng
        await CartModel.deleteOne({ userId: userIdStr }, { session });
      } else {
        console.warn("Không thể xóa giỏ hàng do userId không hợp lệ");
      }

      await session.commitTransaction(); // Hoàn tất transaction
    } catch (error) {
      await session.abortTransaction(); // Hủy bỏ transaction nếu có lỗi
      console.error("Lỗi khi cập nhật tồn kho hoặc xóa giỏ hàng:", error);
      return next(new AppError("Đã xảy ra lỗi khi xử lý đơn hàng sau khi tạo. Vui lòng liên hệ quản trị viên.", 500));
    } finally {
      session.endSession();
    }

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công.",
      data: order,
    });
  }
);

/**
 * @controller getMyOrders
 * @description Lấy danh sách đơn hàng của người dùng hiện tại.
 * @route GET /api/v1/orders/my-orders
 * @access Private
 */
export const getMyOrders = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }

    const orders = await Order.getOrdersByUserId(userId.toString());

    res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn hàng thành công.",
      data: orders,
      count: orders.length,
    });
  }
);

/**
 * @controller getOrderById
 * @description Lấy thông tin chi tiết của một đơn hàng. Đảm bảo người dùng chỉ xem được đơn hàng của mình.
 * @route GET /api/v1/orders/:id
 * @access Private
 * @param {string} id - ID của đơn hàng
 */
export const getOrderById = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const orderId = req.params.id;

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError("ID đơn hàng không hợp lệ.", 400));
    }

    const order = await Order.getOrderById(orderId);

    if (!order) {
      return next(new AppError("Đơn hàng không tồn tại.", 404));
    }

    // Kiểm tra xem người dùng có quyền xem đơn hàng này không
    if (order.userId.toString() !== userId.toString()) {
      return next(
        new AppError("Bạn không có quyền xem đơn hàng này.", 403)
      );
    }

    res.status(200).json({
      success: true,
      message: "Lấy thông tin đơn hàng thành công.",
      data: order,
    });
  }
);

/**
 * @controller cancelOrder
 * @description Cho phép người dùng hủy đơn hàng nếu trạng thái cho phép (chỉ khi đơn hàng ở trạng thái 'pending').
 * @route PUT /api/v1/orders/:id/cancel
 * @access Private
 * @param {string} id - ID của đơn hàng
 */
export const cancelOrder = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const orderId = req.params.id;

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError("ID đơn hàng không hợp lệ.", 400));
    }

    const order = await OrderModel.findById(orderId);

    if (!order) {
      return next(new AppError("Đơn hàng không tồn tại.", 404));
    }

    // Kiểm tra chủ sở hữu đơn hàng
    if (order.userId.toString() !== userId.toString()) {
      return next(
        new AppError("Bạn không có quyền hủy đơn hàng này.", 403)
      );
    }

    // Kiểm tra trạng thái đơn hàng có cho phép hủy không
    // Chỉ cho phép hủy khi đơn hàng đang 'pending' (đang chuẩn bị)
    if (order.status !== OrderStatus.PENDING) {
      return next(
        new AppError(
          `Không thể hủy đơn hàng ở trạng thái '${order.status}'. Chỉ có thể hủy đơn hàng đang trong giai đoạn chuẩn bị.`,
          400
        )
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Cập nhật trạng thái đơn hàng thành 'cancelled'
      order.status = OrderStatus.CANCELLED;
      await order.save({ session });

      // Hoàn lại số lượng tồn kho cho các sản phẩm trong đơn hàng đã hủy
      for (const item of order.items) {
        await ProductModel.findByIdAndUpdate(
          item.productId,
          { $inc: { pd_stock: item.quantity } }, // Cộng lại số lượng
          { session } 
        );
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi hủy đơn hàng:", error);
      return next(new AppError("Đã xảy ra lỗi khi hủy đơn hàng. Vui lòng thử lại.", 500));
    } finally {
      session.endSession();
    }

    res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công.",
      data: order,
    });
  }
);

/**
 * @controller updateOrderStatus
 * @description Cập nhật trạng thái đơn hàng
 * @route PUT /api/v1/orders/:id/status
 * @access Private (yêu cầu token)
 * @param {string} id - ID của đơn hàng
 * @body {OrderStatus} status - Trạng thái mới của đơn hàng
 */
export const updateOrderStatus = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const orderId = req.params.id;
    const { status } = req.body;

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return next(new AppError("ID đơn hàng không hợp lệ.", 400));
    }

    // Kiểm tra status có hợp lệ không
    if (!Object.values(OrderStatus).includes(status)) {
      return next(new AppError(`Trạng thái '${status}' không hợp lệ.`, 400));
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return next(new AppError("Đơn hàng không tồn tại.", 404));
    }

    // Kiểm tra xem người dùng có phải là chủ đơn hàng không
    if (order.userId.toString() !== userId.toString()) {
      return next(
        new AppError("Bạn không có quyền cập nhật đơn hàng này.", 403)
      );
    }

    // Cập nhật trạng thái sử dụng phương thức từ class Order
    const updatedOrder = await Order.updateOrderStatus(orderId, status);

    if (!updatedOrder) {
      return next(new AppError("Không thể cập nhật trạng thái đơn hàng.", 500));
    }

    res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng thành '${status}' thành công.`,
      data: updatedOrder,
    });
  }
);

/**
 * @controller createBuyNowOrder
 * @description Tạo đơn hàng trực tiếp từ một sản phẩm ("Mua ngay") mà không cần thêm vào giỏ hàng
 * @route POST /api/v1/orders/buy-now
 * @access Private
 * @body {IShippingAddress} shippingAddress - Thông tin giao hàng
 * @body {string} paymentMethod - Phương thức thanh toán (ví dụ: 'COD')
 * @body {string} productId - ID của sản phẩm muốn mua
 * @body {number} quantity - Số lượng sản phẩm (mặc định: 1)
 */
export const createBuyNowOrder = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { shippingAddress, paymentMethod, productId, quantity = 1 } = req.body as {
      shippingAddress: IShippingAddress;
      paymentMethod?: string;
      productId: string;
      quantity: number;
    };

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }

    // Đảm bảo userId là string và không null
    const userIdStr = userId.toString();

    if (!shippingAddress) {
      return next(new AppError("Vui lòng cung cấp thông tin giao hàng.", 400));
    }
    if (
      !shippingAddress.fullname ||
      !shippingAddress.address ||
      !shippingAddress.phone
    ) {
      return next(
        new AppError(
          "Thông tin giao hàng không đầy đủ (họ tên, địa chỉ, số điện thoại).",
          400
        )
      );
    }
    // Validate phone format
    if (!/^\d{10}$/.test(shippingAddress.phone)) {
      return next(
        new AppError("Số điện thoại giao hàng không hợp lệ (phải có 10 chữ số).", 400)
      );
    }

    // Kiểm tra productId
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError("ID sản phẩm không hợp lệ.", 400));
    }

    // Kiểm tra số lượng
    if (!quantity || quantity <= 0) {
      return next(new AppError("Số lượng sản phẩm không hợp lệ.", 400));
    }

    // Tìm sản phẩm
    const product = await ProductModel.findById(productId);
    if (!product) {
      return next(new AppError("Sản phẩm không tồn tại.", 404));
    }

    // Kiểm tra số lượng tồn kho
    if (product.pd_stock < quantity) {
      return next(
        new AppError(
          `Sản phẩm '${product.pd_name}' không đủ số lượng tồn kho (cần ${quantity}, còn ${product.pd_stock}).`,
          400
        )
      );
    }

    // Tạo item cho đơn hàng
    const orderItem = {
      productId: product._id,
      name: product.pd_name,
      image: product.pd_image && product.pd_image.length > 0 
        ? product.pd_image[0].url 
        : 'default_image_url.jpg',
      price: product.pd_price.sell_price,
      quantity: quantity,
    };

    // Tính tổng tiền
    const totalPrice = orderItem.price * orderItem.quantity;

    // Tạo đơn hàng
    const orderData: Partial<IOrder> = {
      userId,
      items: [orderItem] as any,
      shippingAddress,
      totalPrice,
      status: OrderStatus.PENDING,
      orderDate: new Date(),
    };
    if (paymentMethod) {
      orderData.paymentMethod = paymentMethod;
    }

    // Sử dụng class Order để tạo đơn hàng
    const order = await Order.createOrder(orderData);

    // Cập nhật số lượng tồn kho
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (!product || !product._id) {
        throw new Error("Không tìm thấy thông tin sản phẩm");
      }
      
      // Đảm bảo productId hợp lệ
      await ProductModel.findByIdAndUpdate(
        product._id.toString(),
        { $inc: { pd_stock: -quantity } },
        { session }
      );

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error("Lỗi khi cập nhật tồn kho:", error);
      return next(new AppError("Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng liên hệ quản trị viên.", 500));
    } finally {
      session.endSession();
    }

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công.",
      data: order,
    });
  }
);