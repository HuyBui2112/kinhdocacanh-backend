import mongoose, { Document, Schema, Types } from "mongoose";
import { ICartItem } from "./cartModel"; // Sử dụng lại ICartItem từ cartModel

/**
 * @interface IShippingAddress
 * @description Interface cho địa chỉ giao hàng
 * @property {string} fullname - Họ và tên người nhận
 * @property {string} address - Địa chỉ chi tiết
 * @property {string} phone - Số điện thoại người nhận
 * @property {string} city - Thành phố (không bắt buộc)
 * @property {string} postalCode - Mã bưu điện (không bắt buộc)
 */
interface IShippingAddress {
  fullname: string;
  address: string;
  phone: string;
  city?: string;
  postalCode?: string;
}

/**
 * @enum OrderStatus
 * @description Các trạng thái của đơn hàng
 */
enum OrderStatus {
  PENDING = 'pending', // Chờ xử lý, đang chuẩn bị
  SHIPPING = 'shipping', // Đang giao hàng
  DELIVERED = 'delivered', // Đã giao thành công
  PAID = 'paid', // Đã thanh toán
  CANCELLED = 'cancelled', // Đã hủy
}

/**
 * @interface IOrder
 * @description Interface định nghĩa kiểu dữ liệu cho đối tượng Order trong MongoDB
 * @property {Types.ObjectId} userId - ID của người dùng (tham chiếu đến User)
 * @property {ICartItem[]} items - Mảng các sản phẩm trong đơn hàng
 * @property {IShippingAddress} shippingAddress - Thông tin giao hàng
 * @property {string} paymentMethod - Phương thức thanh toán
 * @property {number} totalPrice - Tổng tiền đơn hàng
 * @property {OrderStatus} status - Trạng thái đơn hàng
 * @property {Date} orderDate - Ngày đặt hàng
 * @property {Date} paidAt - Thời gian thanh toán thành công
 * @property {Date} deliveredAt - Thời gian giao hàng thành công
 * @property {Date} createdAt - Thời gian tạo
 * @property {Date} updatedAt - Thời gian cập nhật
 */
interface IOrder extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  totalPrice: number;
  status: OrderStatus;
  orderDate: Date;
  paidAt?: Date; // Optional vì có thể chưa thanh toán
  deliveredAt?: Date; // Optional vì có thể chưa giao
  createdAt: Date;
  updatedAt: Date;
}

const ShippingAddressSchema: Schema = new Schema({
  fullname: {
    type: String,
    required: [true, "Họ tên người nhận không được để trống"],
  },
  address: {
    type: String,
    required: [true, "Địa chỉ giao hàng không được để trống"],
  },
  phone: {
    type: String,
    required: [true, "Số điện thoại người nhận không được để trống"],
    validate: {
      validator: function (v: string) {
        return /^\d{10}$/.test(v);
      },
      message: "Số điện thoại không hợp lệ (phải có 10 chữ số)",
    },
  },
  city: {
    type: String,
  },
  postalCode: {
    type: String,
  },
}, {_id: false});

const OrderItemSchema: Schema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "ID sản phẩm không được để trống"],
  },
  name: {
    type: String,
    required: [true, "Tên sản phẩm không được để trống"],
  },
  image: {
    type: String,
    required: [true, "Hình ảnh sản phẩm không được để trống"],
  },
  price: {
    // Lưu lại giá tại thời điểm đặt hàng
    type: Number,
    required: [true, "Giá sản phẩm không được để trống"],
    min: [0, "Giá sản phẩm không được âm"],
  },
  quantity: {
    type: Number,
    required: [true, "Số lượng không được để trống"],
    min: [1, "Số lượng sản phẩm phải lớn hơn 0"],
  },
}, {_id: false});

const OrderSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID người dùng không được để trống"],
    },
    items: [OrderItemSchema],
    shippingAddress: {
      type: ShippingAddressSchema,
      required: [true, "Thông tin giao hàng không được để trống"],
    },
    paymentMethod: {
      type: String,
      required: [true, "Phương thức thanh toán không được để trống"],
      default: "COD", // Thanh toán khi nhận hàng
    },
    totalPrice: {
      type: Number,
      required: [true, "Tổng tiền đơn hàng không được để trống"],
      min: [0, "Tổng tiền không được âm"],
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/**
 * @class Order
 * @description Class mở rộng cho model Order chứa các static methods
 */
class Order {
  /**
   * @static getOrdersByUserId
   * @description Lấy danh sách đơn hàng của người dùng
   * @param {string} userId - ID của người dùng
   * @returns {Promise<IOrder[]>} - Danh sách đơn hàng
   */
  static async getOrdersByUserId(userId: string): Promise<IOrder[]> {
    try {
      return await OrderModel.find({ userId }).sort({ orderDate: -1 });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      throw error;
    }
  }

  /**
   * @static getOrderById
   * @description Lấy chi tiết một đơn hàng
   * @param {string} orderId - ID của đơn hàng
   * @returns {Promise<IOrder | null>} - Đơn hàng hoặc null nếu không tồn tại
   */
  static async getOrderById(orderId: string): Promise<IOrder | null> {
    try {
      return await OrderModel.findById(orderId);
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
      throw error;
    }
  }

  /**
   * @static createOrder
   * @description Tạo đơn hàng mới
   * @param {Object} orderData - Dữ liệu đơn hàng
   * @returns {Promise<IOrder>} - Đơn hàng mới tạo
   */
  static async createOrder(orderData: Partial<IOrder>): Promise<IOrder> {
    try {
      return await OrderModel.create(orderData);
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      throw error;
    }
  }

  /**
   * @static updateOrderStatus
   * @description Cập nhật trạng thái đơn hàng
   * @param {string} orderId - ID của đơn hàng
   * @param {OrderStatus} status - Trạng thái mới
   * @returns {Promise<IOrder | null>} - Đơn hàng đã cập nhật
   */
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder | null> {
    try {
      const updates: any = { status };
      
      // Cập nhật thêm các trường khác tùy vào trạng thái
      if (status === OrderStatus.PAID) {
        updates.paidAt = new Date();
      }
      if (status === OrderStatus.DELIVERED) {
        updates.deliveredAt = new Date();
      }
      
      return await OrderModel.findByIdAndUpdate(
        orderId,
        { $set: updates },
        { new: true }
      );
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      throw error;
    }
  }
}

const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);

export { OrderModel, IOrder, IShippingAddress, OrderStatus, Order }; 