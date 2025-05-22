import mongoose, { Document, Schema, Types } from "mongoose";
import { Price, Image, SEOInfo } from "@/utils/types";

/**
 * @interface IProduct
 * @description Interface định nghĩa kiểu dữ liệu cho đối tượng Product trong MongoDB
 * @property {Types.ObjectId} _id - ID duy nhất của Product
 * @property {string} pd_name - Tên sản phẩm
 * @property {string} pd_slug - Slug cho sản phẩm (dùng trong url, ...)
 * @property {string} pd_category - Loại sản phẩm
 * @property {Image[]} pd_image - Hình ảnh sản phẩm (Mỗi ảnh có url và alt)
 * @property {string} pd_description - Mô tả sản phẩm
 * @property {Price} pd_price - Giá sản phẩm (giá gốc, phần trăm giảm, giá đã giảm)
 * @property {number} pd_stock - Số lượng hàng
 * @property {number} pd_avgRating - Điểm đánh giá trung bình (1 - 5)
 * @property {number} pd_numReviews - Số lượng đánh giá
 * @property {SEOInfo} pd_meta - Thông tin cho các thẻ trên <head>
 * @property {Date} createdAt - Thời gian tạo
 * @property {Date} updatedAt - Thời gian cập nhật
 */
interface IProduct extends Document {
    _id: Types.ObjectId;
    pd_name: string;
    pd_slug: string;
    pd_category: string;
    pd_image: Image[];
    pd_description: string;
    pd_price: Price;
    pd_stock: number;
    pd_avgRating: number;
    pd_numReviews: number;
    pd_meta: SEOInfo;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * @schema ProductSchema
 * @description Schema cho collection Product trong MongoDB
 */
const ProductSchema: Schema = new Schema({
    pd_name: {
        type: String,
        required: [true, 'Tên sản phẩm không được để trống'],
        trim: true
    },
    pd_slug: {
        type: String,
        required: [true, 'Slug không được để trống'],
        unique: true,
        trim: true
    },
    pd_category: {
        type: String,
        required: [true, 'Loại sản phẩm không được để trống'],
        trim: true
    },
    pd_image: [{
        url: {
            type: String,
            required: [true, 'URL hình ảnh không được để trống']
        },
        alt: {
            type: String,
            required: [true, 'Alt text không được để trống']
        }
    }],
    pd_description: {
        type: String,
        required: [true, 'Mô tả sản phẩm không được để trống']
    },
    pd_price: {
        origin_price: {
            type: Number,
            required: [true, 'Giá gốc không được để trống'],
            min: [0, 'Giá gốc không được âm']
        },
        discount: {
            type: Number,
            default: 0,
            min: [0, 'Phần trăm giảm giá không được âm'],
            max: [100, 'Phần trăm giảm giá không được vượt quá 100']
        },
        sell_price: {
            type: Number,
            required: [true, 'Giá bán không được để trống'],
            min: [0, 'Giá bán không được âm']
        }
    },
    pd_stock: {
        type: Number,
        required: [true, 'Số lượng hàng không được để trống'],
        min: [0, 'Số lượng hàng không được âm']
    },
    pd_avgRating: {
        type: Number,
        default: 0,
        min: [0, 'Điểm đánh giá không được âm'],
        max: [5, 'Điểm đánh giá không được vượt quá 5']
    },
    pd_numReviews: {
        type: Number,
        default: 0,
        min: [0, 'Số lượng đánh giá không được âm']
    },
    pd_meta: {
        title: {
            type: String,
            required: [true, 'Meta title không được để trống']
        },
        metaDescription: {
            type: String,
            required: [true, 'Meta description không được để trống']
        },
        keywords: [{
            type: String,
            required: [true, 'Keywords không được để trống']
        }],
        canonical: {
            type: String,
            required: [true, 'Canonical URL không được để trống']
        },
        image: {
            type: String,
            required: [true, 'Meta image không được để trống']
        },
        ogTitle: {
            type: String,
            required: [true, 'OG title không được để trống']
        },
        ogDescription: {
            type: String,
            required: [true, 'OG description không được để trống']
        },
        ogImage: {
            type: String,
            required: [true, 'OG image không được để trống']
        },
        ogType: {
            type: String,
            required: [true, 'OG type không được để trống']
        },
        twitterTitle: {
            type: String,
            required: [true, 'Twitter title không được để trống']
        },
        twitterDescription: {
            type: String,
            required: [true, 'Twitter description không được để trống']
        },
        twitterImage: {
            type: String,
            required: [true, 'Twitter image không được để trống']
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

// Tạo model từ schema
const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);

/**
 * @class Product
 * @description Class mở rộng cho model Product chứa các static methods
 */
class Product {
    /**
     * @static getProducts
     * @description Lấy danh sách sản phẩm với phân trang và bộ lọc
     * @param {Object} options - Các tùy chọn lọc và phân trang
     * @returns {Promise<{products: IProduct[], total: number}>} - Danh sách sản phẩm và tổng số
     */
    static async getProducts(options: {
        page?: number;
        limit?: number;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
        sortBy?: 'name' | 'price' | 'rating';
        sortOrder?: 'asc' | 'desc';
    }): Promise<{products: IProduct[], total: number}> {
        try {
            const {
                page = 1,
                limit = 10,
                category,
                minPrice,
                maxPrice,
                inStock,
                sortBy = 'name',
                sortOrder = 'asc'
            } = options;

            // Xây dựng query
            const query: any = {};

            // Lọc theo loại sản phẩm
            if (category) {
                query.pd_category = category;
            }

            // Lọc theo khoảng giá
            if (minPrice !== undefined || maxPrice !== undefined) {
                query.$or = [
                    // Nếu có giảm giá, dùng giá bán
                    {
                        'pd_price.discount': { $gt: 0 },
                        'pd_price.sell_price': {
                            ...(minPrice !== undefined && { $gte: minPrice }),
                            ...(maxPrice !== undefined && { $lte: maxPrice })
                        }
                    },
                    // Nếu không có giảm giá, dùng giá gốc
                    {
                        'pd_price.discount': 0,
                        'pd_price.origin_price': {
                            ...(minPrice !== undefined && { $gte: minPrice }),
                            ...(maxPrice !== undefined && { $lte: maxPrice })
                        }
                    }
                ];
            }

            // Lọc theo còn hàng/hết hàng
            if (inStock !== undefined) {
                query.pd_stock = inStock ? { $gt: 0 } : 0;
            }

            // Xây dựng sort
            const sort: any = {};
            switch (sortBy) {
                case 'name':
                    sort.pd_name = sortOrder === 'asc' ? 1 : -1;
                    break;
                case 'price':
                    sort['pd_price.sell_price'] = sortOrder === 'asc' ? 1 : -1;
                    break;
                case 'rating':
                    sort.pd_avgRating = -1; // Luôn sắp xếp giảm dần
                    break;
            }

            // Thực hiện query
            const skip = (page - 1) * limit;
            const [products, total] = await Promise.all([
                ProductModel.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit),
                ProductModel.countDocuments(query)
            ]);

            return { products, total };
        } catch (error) {
            throw error;
        }
    }

    /**
     * @static searchProducts
     * @description Tìm kiếm sản phẩm theo tên
     * @param {string} keyword - Từ khóa tìm kiếm
     * @returns {Promise<IProduct[]>} - Danh sách sản phẩm tìm được
     */
    static async searchProducts(keyword: string): Promise<IProduct[]> {
        try {
            // Chuyển keyword về chữ thường không dấu
            const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            // Tìm tất cả sản phẩm
            const products = await ProductModel.find({});

            // Lọc sản phẩm theo keyword
            const matchedProducts = products.filter(product => {
                const normalizedName = product.pd_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return normalizedName.includes(normalizedKeyword);
            });

            return matchedProducts;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @static getProductById
     * @description Lấy chi tiết sản phẩm theo ID
     * @param {string} productId - ID của sản phẩm
     * @returns {Promise<IProduct | null>} - Thông tin chi tiết sản phẩm
     */
    static async getProductById(productId: string): Promise<IProduct | null> {
        try {
            return await ProductModel.findById(productId);
        } catch (error) {
            throw error;
        }
    }

    /**
     * @static updateProductRating
     * @description Cập nhật điểm đánh giá trung bình và số lượng đánh giá của sản phẩm
     * @param {string} productId - ID của sản phẩm
     * @returns {Promise<void>}
     */
    static async updateProductRating(productId: string): Promise<void> {
        try {
            // Lấy tất cả đánh giá của sản phẩm
            const reviews = await mongoose.model('Review').find({ product_id: productId });

            // Tính toán số lượng đánh giá và điểm trung bình
            const numReviews = reviews.length;
            const avgRating = numReviews > 0
                ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / numReviews).toFixed(1))
                : 0;

            // Cập nhật sản phẩm
            await ProductModel.findByIdAndUpdate(productId, {
                pd_numReviews: numReviews,
                pd_avgRating: avgRating
            });
        } catch (error) {
            throw error;
        }
    }
}

export { ProductModel, IProduct, Product };