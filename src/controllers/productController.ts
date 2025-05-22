import { Request, Response } from 'express';
import { Product, ProductModel } from '@/models';
import { AppError, asyncHandler } from '@/middlewares';

/**
 * @class ProductController
 * @description Controller xử lý các request liên quan đến sản phẩm
 */
class ProductController {
    /**
     * @method getProducts
     * @description Lấy danh sách sản phẩm với phân trang và bộ lọc
     * @route GET /api/products
     */
    static async getProducts(req: Request, res: Response) {
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
            } = req.query;

            const { products, total } = await Product.getProducts({
                page: Number(page),
                limit: Number(limit),
                category: category as string,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                inStock: inStock ? inStock === 'true' : undefined,
                sortBy: sortBy as 'name' | 'price' | 'rating',
                sortOrder: sortOrder as 'asc' | 'desc'
            });

            // Chuyển đổi dữ liệu theo định dạng response
            const formattedProducts = products.map(product => ({
                _id: product._id,
                name: product.pd_name,
                slug: product.pd_slug,
                category: product.pd_category,
                imageFirst: product.pd_image[0]?.url || '',
                price: product.pd_price,
                avgRating: product.pd_avgRating,
                numReviews: product.pd_numReviews,
                updatedAt: product.updatedAt
            }));

            res.status(200).json({
                success: true,
                data: {
                    products: formattedProducts,
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

    /**
     * @method searchProducts
     * @description Tìm kiếm sản phẩm theo tên
     * @route GET /api/products/search
     */
    static async searchProducts(req: Request, res: Response) {
        try {
            const { keyword } = req.query;

            if (!keyword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập từ khóa tìm kiếm'
                });
            }

            const products = await Product.searchProducts(keyword as string);

            // Chuyển đổi dữ liệu theo định dạng response
            const formattedProducts = products.map(product => ({
                _id: product._id,
                name: product.pd_name,
                slug: product.pd_slug,
                category: product.pd_category,
                imageFirst: product.pd_image[0]?.url || '',
                price: product.pd_price,
                avgRating: product.pd_avgRating,
                numReviews: product.pd_numReviews,
                updatedAt: product.updatedAt
            }));

            res.status(200).json({
                success: true,
                data: formattedProducts
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method getProductById
     * @description Lấy chi tiết sản phẩm theo ID
     * @route GET /api/products/:id
     */
    static async getProductById(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const product = await Product.getProductById(id);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy sản phẩm'
                });
            }

            res.status(200).json({
                success: true,
                data: product
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method createProduct
     * @description Tạo sản phẩm mới
     * @route POST /api/products
     * @access Private
     */
    static async createProduct(req: Request, res: Response) {
        try {
            const {
                pd_name,
                pd_slug,
                pd_category,
                pd_price,
                pd_image,
                pd_description,
                pd_stock,
                pd_specifications
            } = req.body;

            // Kiểm tra các trường bắt buộc
            if (!pd_name || !pd_slug || !pd_category || !pd_price) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm'
                });
            }

            // Tạo sản phẩm mới
            const product = await ProductModel.create({
                pd_name,
                pd_slug,
                pd_category,
                pd_price: {
                    origin_price: pd_price,
                    discount: 0,
                    sell_price: pd_price
                },
                pd_image: pd_image || [],
                pd_description: pd_description || '',
                pd_stock: pd_stock || 0,
                pd_meta: {
                    title: pd_name,
                    metaDescription: pd_description || '',
                    keywords: [pd_category],
                    canonical: `/products/${pd_slug}`,
                    image: pd_image?.[0]?.url || '',
                    ogTitle: pd_name,
                    ogDescription: pd_description || '',
                    ogImage: pd_image?.[0]?.url || '',
                    ogType: 'product',
                    twitterTitle: pd_name,
                    twitterDescription: pd_description || '',
                    twitterImage: pd_image?.[0]?.url || ''
                }
            });

            res.status(201).json({
                success: true,
                message: 'Tạo sản phẩm thành công',
                data: product
            });
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug sản phẩm đã tồn tại'
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }
}

export default ProductController; 