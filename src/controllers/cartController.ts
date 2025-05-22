import { Response, NextFunction } from "express";
import { Cart, CartModel, ProductModel, ICartItem } from "@/models";
import { AppError, asyncHandler } from "@/middlewares";
import { AuthRequest } from "@/middlewares/auth.middleware"; // Đảm bảo import AuthRequest
import mongoose from "mongoose";

/**
 * @controller getCart
 * @description Lấy thông tin giỏ hàng của người dùng hiện tại. Nếu chưa có, tạo giỏ hàng mới.
 * @route GET /api/v1/cart
 * @access Private
 */
export const getCart = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Lấy userId từ req.user (đã được set bởi middleware authenticate)
    const userId = req.user?._id;
    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }

    // Chuyển userId thành string và đảm bảo không null
    const userIdStr = userId.toString();
    
    let cart = await Cart.getCartByUserId(userIdStr);

    // Nếu không có giỏ hàng, trả về giỏ hàng trống mà không tạo document mới
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Giỏ hàng trống.",
        data: {
          userId: userIdStr,
          items: [],
          totalPrice: 0
        },
      });
    }

    // Tính tổng tiền giỏ hàng
    const totalPrice = Cart.calculateTotal(cart.items);

    res.status(200).json({
      success: true,
      message: "Lấy thông tin giỏ hàng thành công.",
      data: {
        ...cart.toObject(),
        totalPrice
      },
    });
  }
);

/**
 * @controller addItemToCart
 * @description Thêm sản phẩm vào giỏ hàng hoặc cập nhật số lượng nếu sản phẩm đã tồn tại.
 * @route POST /api/v1/cart/items
 * @access Private
 * @body {string} productId - ID của sản phẩm
 * @body {number} quantity - Số lượng sản phẩm (mặc định là 1 nếu không cung cấp)
 */
export const addItemToCart = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }
    
    // Chuyển userId thành string và đảm bảo không null
    const userIdStr = userId.toString();
    
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError("ID sản phẩm không hợp lệ.", 400));
    }
    if (typeof quantity !== 'number' || quantity <= 0) {
        return next(new AppError("Số lượng sản phẩm không hợp lệ.", 400));
    }

    // Tìm sản phẩm
    const product = await ProductModel.findById(productId);
    if (!product) {
      return next(new AppError("Sản phẩm không tồn tại.", 404));
    }

    if (product.pd_stock < quantity) {
      return next(
        new AppError(`Số lượng tồn kho không đủ. Chỉ còn ${product.pd_stock} sản phẩm.`, 400)
      );
    }

    // Lấy giỏ hàng hiện tại nếu có
    let cart = await Cart.getCartByUserId(userIdStr);
    let cartItems = cart ? [...cart.items] : [];

    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = cartItems.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Nếu sản phẩm đã tồn tại, cập nhật số lượng
      const newQuantity = cartItems[existingItemIndex].quantity + quantity;
      if (product.pd_stock < newQuantity) {
        return next(
          new AppError(`Số lượng tồn kho không đủ để thêm ${quantity} sản phẩm. Chỉ còn ${product.pd_stock} sản phẩm.`, 400)
        );
      }
      cartItems[existingItemIndex].quantity = newQuantity;
    } else {
      // Nếu sản phẩm chưa tồn tại, thêm mới vào giỏ
      const cartItem: ICartItem = {
        productId: product._id,
        name: product.pd_name,
        // Ưu tiên lấy ảnh đầu tiên trong mảng pd_image, nếu không có thì dùng placeholder
        image: product.pd_image && product.pd_image.length > 0 ? product.pd_image[0].url : 'default_image_url.jpg',
        price: product.pd_price.sell_price, // Lấy giá bán hiện tại của sản phẩm
        quantity,
      } as ICartItem; // Cần ép kiểu vì ICartItem kế thừa từ Document
      cartItems.push(cartItem);
    }

    // Sử dụng phương thức updateCart để lưu giỏ hàng đã cập nhật
    cart = await Cart.updateCart(userIdStr, cartItems);

    // Tính tổng tiền giỏ hàng
    const totalPrice = cart ? Cart.calculateTotal(cart.items) : 0;

    res.status(200).json({
      success: true,
      message: "Thêm sản phẩm vào giỏ hàng thành công.",
      data: cart ? {
        ...cart.toObject(),
        totalPrice
      } : { userId: userIdStr, items: [], totalPrice: 0 },
    });
  }
);

/**
 * @controller updateCart
 * @description Cập nhật toàn bộ giỏ hàng từ client. Client gửi lên trạng thái mới nhất của giỏ hàng và server lưu trữ.
 * @route PUT /api/v1/cart
 * @access Private
 * @body {ICartItem[]} items - Danh sách sản phẩm trong giỏ hàng
 */
export const updateCart = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { items } = req.body;

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }
    
    // Chuyển userId thành string và đảm bảo không null
    const userIdStr = userId.toString();
    
    if (!Array.isArray(items)) {
      return next(new AppError("Dữ liệu giỏ hàng không hợp lệ.", 400));
    }

    // Lọc bỏ các sản phẩm có quantity <= 0 (items cần xóa)
    const validItems = items.filter(item => item.quantity > 0);
    
    // Kiểm tra dữ liệu đầu vào và số lượng tồn kho cho các sản phẩm còn lại
    for (const item of validItems) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId.toString())) {
        return next(new AppError(`ID sản phẩm không hợp lệ: ${item.productId}`, 400));
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return next(new AppError("Số lượng sản phẩm không hợp lệ.", 400));
      }

      // Kiểm tra tồn kho
      const product = await ProductModel.findById(item.productId);
      if (!product) {
        return next(new AppError(`Sản phẩm với ID ${item.productId} không tồn tại.`, 404));
      }
      if (product.pd_stock < item.quantity) {
        return next(
          new AppError(`Sản phẩm '${product.pd_name}' không đủ tồn kho. Chỉ còn ${product.pd_stock} sản phẩm.`, 400)
        );
      }

      // Cập nhật thông tin sản phẩm từ DB để đảm bảo chính xác
      item.name = product.pd_name;
      item.image = product.pd_image && product.pd_image.length > 0 ? product.pd_image[0].url : 'default_image_url.jpg';
      item.price = product.pd_price.sell_price;
    }

    // Lưu giỏ hàng mới (chỉ với các sản phẩm có quantity > 0)
    const updatedCart = await Cart.updateCart(userIdStr, validItems as ICartItem[]);

    if (!updatedCart) {
      return next(new AppError("Không thể cập nhật giỏ hàng.", 500));
    }

    // Tính tổng tiền giỏ hàng
    const totalPrice = Cart.calculateTotal(updatedCart.items);

    res.status(200).json({
      success: true,
      message: "Cập nhật giỏ hàng thành công.",
      data: {
        ...updatedCart.toObject(),
        totalPrice
      }
    });
  }
);

/**
 * @controller updateCartItem
 * @description Cập nhật số lượng của một sản phẩm trong giỏ hàng.
 * @route PUT /api/v1/cart/items/:productId
 * @access Private
 * @param {string} productId - ID của sản phẩm trong giỏ hàng
 * @body {number} quantity - Số lượng mới (nếu <= 0, sản phẩm sẽ bị xóa)
 */
export const updateCartItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }

    // Chuyển userId thành string
    const userIdStr = userId.toString();
    
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError("ID sản phẩm không hợp lệ.", 400));
    }
    if (typeof quantity !== 'number' ) { // Cho phép quantity = 0 để xóa
        return next(new AppError("Số lượng sản phẩm không hợp lệ.", 400));
    }

    let cart = await Cart.getCartByUserId(userIdStr);
    if (!cart) {
      return next(new AppError("Giỏ hàng không tồn tại.", 404));
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return next(new AppError("Sản phẩm không có trong giỏ hàng.", 404));
    }

    if (quantity <= 0) {
      // Nếu số lượng <= 0, xóa sản phẩm khỏi giỏ
      cart.items.splice(itemIndex, 1);
    } else {
      // Cập nhật số lượng
      const product = await ProductModel.findById(productId);
      if (!product) {
        // Mặc dù item có trong giỏ, nhưng nên kiểm tra lại product phòng trường hợp product bị xóa
        return next(new AppError("Sản phẩm không tồn tại.", 404));
      }
      if (product.pd_stock < quantity) {
        return next(
          new AppError(`Số lượng tồn kho không đủ. Chỉ còn ${product.pd_stock} sản phẩm.`, 400)
        );
      }
      cart.items[itemIndex].quantity = quantity;
      // Cập nhật lại giá nếu cần thiết (thường giá đã được lưu lúc thêm)
      // cart.items[itemIndex].price = product.pd_price.sell_price;
    }

    // Sử dụng phương thức updateCart để lưu giỏ hàng đã cập nhật
    cart = await Cart.updateCart(userIdStr, cart.items);

    // Tính tổng tiền giỏ hàng (0 nếu cart đã bị xóa hoàn toàn)
    const totalPrice = cart ? Cart.calculateTotal(cart.items) : 0;

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm trong giỏ hàng thành công.",
      data: cart ? {
        ...cart.toObject(),
        totalPrice
      } : { userId: userIdStr, items: [], totalPrice: 0 },
    });
  }
);

/**
 * @controller removeCartItem
 * @description Xóa một sản phẩm khỏi giỏ hàng.
 * @route DELETE /api/v1/cart/items/:productId
 * @access Private
 * @param {string} productId - ID của sản phẩm cần xóa
 */
export const removeCartItem = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    const { productId } = req.params;

    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }

    // Chuyển userId thành string
    const userIdStr = userId.toString();
    
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return next(new AppError("ID sản phẩm không hợp lệ.", 400));
    }

    let cart = await Cart.getCartByUserId(userIdStr);

    if (!cart) {
      // Thực tế, nếu không có giỏ hàng thì cũng không có item để xóa
      return next(new AppError("Giỏ hàng không tồn tại.", 404));
    }

    const initialLength = cart.items.length;
    const updatedItems = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    if (updatedItems.length === initialLength) {
      return next(new AppError("Sản phẩm không có trong giỏ hàng.", 404));
    }

    // Sử dụng phương thức updateCart để lưu giỏ hàng đã cập nhật
    cart = await Cart.updateCart(userIdStr, updatedItems);

    // Tính tổng tiền giỏ hàng (0 nếu cart đã bị xóa hoàn toàn)
    const totalPrice = cart ? Cart.calculateTotal(cart.items) : 0;

    res.status(200).json({
      success: true,
      message: "Xóa sản phẩm khỏi giỏ hàng thành công.",
      data: cart ? {
        ...cart.toObject(),
        totalPrice
      } : { userId: userIdStr, items: [], totalPrice: 0 },
    });
  }
);

/**
 * @controller clearCart
 * @description Xóa tất cả sản phẩm khỏi giỏ hàng.
 * @route DELETE /api/v1/cart
 * @access Private
 */
export const clearCart = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?._id;
    if (!userId) {
      return next(new AppError("Không tìm thấy thông tin người dùng.", 401));
    }

    // Chuyển userId thành string
    const userIdStr = userId.toString();

    // Xóa cart (sẽ trả về null thay vì cart với items rỗng)
    await Cart.clearCart(userIdStr);

    // Trả về thông báo thành công và giỏ hàng rỗng
    res.status(200).json({
      success: true,
      message: "Xóa toàn bộ giỏ hàng thành công.",
      data: { userId: userIdStr, items: [], totalPrice: 0 },
    });
  }
);

// Thêm các hàm tiện ích nếu cần, ví dụ: tính tổng tiền giỏ hàng (mặc dù thường tính khi tạo đơn hàng)
// export const calculateCartTotal = (items: ICartItem[]): number => {
//   return items.reduce((total, item) => total + item.price * item.quantity, 0);
// }; 