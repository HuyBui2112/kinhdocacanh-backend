import { Request, Response } from 'express';
import { Blog, BlogModel } from '@/models';
import { AppError, asyncHandler } from '@/middlewares';

/**
 * @class BlogController
 * @description Controller xử lý các request liên quan đến bài viết blog
 */
class BlogController {
    /**
     * @method getBlogs
     * @description Lấy danh sách bài viết với phân trang và bộ lọc
     * @route GET /api/blogs
     */
    static async getBlogs(req: Request, res: Response) {
        try {
            const {
                page = 1,
                limit = 10,
                tags,
                sortBy = 'publishedAt',
                sortOrder = 'desc'
            } = req.query;

            // Xử lý tags từ query string
            let tagsArray: string[] | undefined;
            if (tags) {
                tagsArray = Array.isArray(tags) 
                    ? tags as string[] 
                    : (tags as string).split(',');
            }

            const { blogs, total } = await Blog.getBlogs({
                page: Number(page),
                limit: Number(limit),
                tags: tagsArray,
                sortBy: sortBy as 'publishedAt' | 'title',
                sortOrder: sortOrder as 'asc' | 'desc'
            });

            // Chuyển đổi dữ liệu theo định dạng response
            const formattedBlogs = blogs.map(blog => ({
                _id: blog._id,
                title: blog.title,
                slug: blog.slug,
                tags: blog.tags,
                author: blog.author,
                publishedAt: blog.publishedAt,
                updatedAt: blog.updatedAt,
                image: blog.blog_image
            }));

            res.status(200).json({
                success: true,
                data: {
                    blogs: formattedBlogs,
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
     * @method getBlogBySlug
     * @description Lấy chi tiết bài viết theo slug
     * @route GET /api/blogs/:slug
     */
    static async getBlogBySlug(req: Request, res: Response) {
        try {
            const { slug } = req.params;

            const blog = await Blog.getBlogBySlug(slug);

            if (!blog) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            res.status(200).json({
                success: true,
                data: blog
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method createBlog
     * @description Tạo bài viết mới
     * @route POST /api/blogs
     * @access Private
     */
    static async createBlog(req: Request, res: Response) {
        try {
            const {
                title,
                slug,
                tags,
                content,
                author,
                meta,
                blog_image
            } = req.body;

            // Kiểm tra các trường bắt buộc
            if (!title || !slug || !tags || !content || !author || !blog_image) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng cung cấp đầy đủ thông tin bài viết'
                });
            }

            // Tạo bài viết mới
            const blog = await BlogModel.create({
                title,
                slug,
                tags,
                content,
                author,
                meta: meta || {
                    title: title,
                    metaDescription: this.generateSummary(content),
                    keywords: tags,
                    canonical: `/blogs/${slug}`,
                    image: blog_image,
                    ogTitle: title,
                    ogDescription: this.generateSummary(content),
                    ogImage: blog_image,
                    ogType: 'article',
                    twitterTitle: title,
                    twitterDescription: this.generateSummary(content),
                    twitterImage: blog_image
                },
                publishedAt: new Date(),
                blog_image
            });

            res.status(201).json({
                success: true,
                message: 'Tạo bài viết thành công',
                data: blog
            });
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug bài viết đã tồn tại'
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method updateBlog
     * @description Cập nhật bài viết
     * @route PUT /api/blogs/:id
     * @access Private
     */
    static async updateBlog(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const blog = await BlogModel.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true, runValidators: true }
            );

            if (!blog) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Cập nhật bài viết thành công',
                data: blog
            });
        } catch (error: any) {
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug bài viết đã tồn tại'
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method deleteBlog
     * @description Xóa bài viết
     * @route DELETE /api/blogs/:id
     * @access Private
     */
    static async deleteBlog(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const blog = await BlogModel.findByIdAndDelete(id);

            if (!blog) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài viết'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Xóa bài viết thành công'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi server'
            });
        }
    }

    /**
     * @method generateSummary
     * @description Tạo tóm tắt bài viết từ nội dung markdown
     * @private
     */
    private static generateSummary(content: string): string {
        try {
            // Loại bỏ tất cả các thẻ markdown
            let plainText = content
                .replace(/#{1,6}\s/g, '') // Loại bỏ các tiêu đề
                .replace(/\*\*(.*?)\*\*/g, '$1') // Loại bỏ bold
                .replace(/\*(.*?)\*/g, '$1') // Loại bỏ italic
                .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Loại bỏ links
                .replace(/!\[(.*?)\]\(.*?\)/g, '') // Loại bỏ images
                .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Loại bỏ code
                .replace(/\n/g, ' ') // Thay thế xuống dòng bằng khoảng trắng
                .trim();
            
            // Lấy 200 ký tự đầu tiên làm tóm tắt
            if (plainText.length > 200) {
                plainText = plainText.substring(0, 197) + '...';
            }
            
            return plainText;
        } catch (error) {
            console.error('Error generating summary:', error);
            return '';
        }
    }
}

export default BlogController; 