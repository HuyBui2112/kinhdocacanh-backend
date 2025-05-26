import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * @interface ICartItem
 * @description Interface cho một sản phẩm trong giỏ hàng
 * @property {Types.ObjectId} productId - ID của sản phẩm (tham chiếu đến Product)
 * @property {string} name - Tên sản phẩm
 * @property {string} image - URL hình ảnh sản phẩm
 * @property {number} price - Giá sản phẩm tại thời điểm thêm vào giỏ
 * @property {number} quantity - Số lượng sản phẩm
 */
interface ICartItem extends Document {
  productId: Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

/**
 * @interface ICart
 * @description Interface định nghĩa kiểu dữ liệu cho đối tượng Cart trong MongoDB
 * @property {Types.ObjectId} userId - ID của người dùng (tham chiếu đến User, unique)
 * @property {ICartItem[]} items - Mảng các sản phẩm trong giỏ
 * @property {Date} createdAt - Thời gian tạo
 * @property {Date} updatedAt - Thời gian cập nhật
 */
interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema: Schema = new Schema({
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
    type: Number,
    required: [true, "Giá sản phẩm không được để trống"],
    min: [0, "Giá sản phẩm không được âm"],
  },
  quantity: {
    type: Number,
    required: [true, "Số lượng không được để trống"],
    min: [1, "Số lượng sản phẩm phải lớn hơn 0"],
  },
}, {_id: false}); // Không tạo _id cho subdocument

const CartSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID người dùng không được để trống"],
      unique: true, // Mỗi người dùng chỉ có một giỏ hàng
      index: true, // Thêm index cho userId
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { 
      virtuals: true 
    },
    collection: 'carts' // Chỉ định rõ tên collection
  }
);

// Thêm middleware để kiểm tra userId không null trước khi lưu
CartSchema.pre('save', function(next) {
  if (!this.userId) {
    next(new Error('userId không được phép là null hoặc undefined'));
    return;
  }
  next();
});

// Thêm middleware để kiểm tra userId không null trước khi cập nhật
CartSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  const update = this.getUpdate() as any;
  if (update && (update.userId === null || update.userId === undefined)) {
    next(new Error('userId không được phép cập nhật thành null hoặc undefined'));
    return;
  }
  next();
});

// Thêm middleware để xử lý trường hợp duplicate key
CartSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Đã tồn tại giỏ hàng cho người dùng này'));
  } else {
    next(error);
  }
});

// Xóa các giỏ hàng không hợp lệ khi khởi động
CartSchema.statics.cleanupInvalidCarts = async function() {
  try {
    const result = await this.deleteMany({
      $or: [
        { userId: null },
        { userId: undefined },
        { userId: { $exists: false } }
      ]
    });
    if (result.deletedCount > 0) {
      console.log(`Đã xóa ${result.deletedCount} giỏ hàng không hợp lệ`);
    }
  } catch (error) {
    console.error('Lỗi khi dọn dẹp giỏ hàng:', error);
  }
};

/**
 * @class Cart
 * @description Class mở rộng cho model Cart chứa các static methods
 */
class Cart {
  /**
   * @static getCartByUserId
   * @description Lấy thông tin giỏ hàng của người dùng
   * @param {string} userId - ID của người dùng
   * @returns {Promise<ICart | null>} - Giỏ hàng của người dùng hoặc null nếu không tồn tại
   */
  static async getCartByUserId(userId: string): Promise<ICart | null> {
    try {
      return await CartModel.findOne({ userId });
    } catch (error) {
      console.error('Lỗi khi lấy giỏ hàng:', error);
      throw error;
    }
  }

  /**
   * @static removeNullUserIdCarts
   * @description Xóa tất cả các giỏ hàng có userId null hoặc không hợp lệ
   * @returns {Promise<number>} - Số lượng document đã xóa
   */
  static async removeNullUserIdCarts(): Promise<number> {
    try {
      const result = await CartModel.deleteMany({ 
        $or: [
          { userId: null },
          { userId: undefined }
        ] 
      });
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Lỗi khi xóa các giỏ hàng không hợp lệ:', error);
      throw error;
    }
  }

  /**
   * @static createCart
   * @description Tạo giỏ hàng mới cho người dùng với các sản phẩm ban đầu
   * @param {string} userId - ID của người dùng
   * @param {ICartItem[]} initialItems - Các sản phẩm ban đầu cho giỏ hàng (mặc định là rỗng)
   * @returns {Promise<ICart>} - Giỏ hàng mới
   * @throws {Error} - Nếu không có sản phẩm nào và preventEmpty là true
   */
  static async createCart(
    userId: string, 
    initialItems: ICartItem[] = []
  ): Promise<ICart> {
    try {
      // Không cho phép tạo giỏ hàng trống - nếu không có sản phẩm, throw error
      if (initialItems.length === 0) {
        throw new Error("Không thể tạo giỏ hàng trống");
      }
      
      return await CartModel.create({ userId, items: initialItems });
    } catch (error) {
      console.error('Lỗi khi tạo giỏ hàng:', error);
      throw error;
    }
  }

  /**
   * @static updateCart
   * @description Cập nhật toàn bộ giỏ hàng
   * @param {string} userId - ID của người dùng
   * @param {ICartItem[]} items - Danh sách sản phẩm cập nhật
   * @returns {Promise<ICart | null>} - Giỏ hàng đã cập nhật
   */
  static async updateCart(userId: string, items: ICartItem[]): Promise<ICart | null> {
    try {
      if (!userId) {
        throw new Error('userId không được để trống');
      }

      // Nếu items là một mảng rỗng, xóa hoàn toàn document thay vì cập nhật
      if (items.length === 0) {
        return this.clearCart(userId);
      }

      // Sử dụng findOneAndUpdate với upsert để tạo mới nếu chưa tồn tại
      const updatedCart = await CartModel.findOneAndUpdate(
        { userId },
        { $set: { items } },
        { 
          new: true, 
          runValidators: true,
          upsert: true, // Tạo mới nếu chưa tồn tại
          setDefaultsOnInsert: true // Áp dụng giá trị mặc định khi tạo mới
        }
      );

      return updatedCart;
    } catch (error) {
      console.error('Lỗi khi cập nhật giỏ hàng:', error);
      // Xử lý các lỗi validate cụ thể
      if (error instanceof mongoose.Error.ValidationError) {
        // Ném lỗi với thông báo cụ thể hơn
        const errorMessage = Object.values(error.errors)
          .map(err => err.message)
          .join(', ');
        throw new Error(`Lỗi dữ liệu: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * @static clearCart
   * @description Xóa tất cả sản phẩm trong giỏ hàng
   * @param {string} userId - ID của người dùng
   * @returns {Promise<ICart | null>} - Giỏ hàng đã xóa sạch hoặc null
   */
  static async clearCart(userId: string): Promise<ICart | null> {
    try {
      if (!userId) {
        throw new Error('userId không được để trống');
      }
      // Thay vì cập nhật items thành mảng rỗng, ta xóa hoàn toàn document
      await CartModel.deleteOne({ userId });
      return null;
    } catch (error) {
      console.error('Lỗi khi xóa giỏ hàng:', error);
      throw error;
    }
  }

  /**
   * @static calculateTotal
   * @description Tính tổng tiền của giỏ hàng
   * @param {ICartItem[]} items - Danh sách sản phẩm trong giỏ hàng
   * @returns {number} - Tổng tiền của giỏ hàng
   */
  static calculateTotal(items: ICartItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * @static checkProductInCart
   * @description Kiểm tra sản phẩm có trong giỏ hàng
   * @param {string} userId - ID của người dùng
   * @param {string} productId - ID của sản phẩm
   * @returns {Promise<boolean>} - Trả về true nếu sản phẩm có trong giỏ, false nếu không
   */
  static async checkProductInCart(userId: string, productId: string): Promise<boolean> {
    try {
      const cart = await CartModel.findOne({ 
        userId,
        'items.productId': productId 
      });
      return !!cart; // Trả về true nếu tìm thấy, false nếu không
    } catch (error) {
      console.error('Lỗi khi kiểm tra sản phẩm trong giỏ hàng:', error);
      throw error;
    }
  }
}

const CartModel = mongoose.model<ICart>("Cart", CartSchema);

export { CartModel, ICart, ICartItem, Cart }; 