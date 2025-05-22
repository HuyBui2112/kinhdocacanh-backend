import mongoose, { Document, Schema, Types } from "mongoose";
import { SEOInfo } from "@/utils/types";

/**
 * @interface IBlog
 * @description Interface định nghĩa kiểu dữ liệu cho đối tượng Blog trong MongoDB
 * @property {Types.ObjectId} _id - ID duy nhất của Blog
 * @property {string} title - Tiêu đề bài viết
 * @property {string} slug - Slug cho bài viết (dùng trong URL)
 * @property {string[]} tags - Các thẻ gắn với bài viết
 * @property {string} content - Nội dung bài viết dạng markdown
 * @property {string} author - Tác giả bài viết
 * @property {SEOInfo} meta - Thông tin SEO cho bài viết
 * @property {Date} publishedAt - Thời gian xuất bản
 * @property {Date} updatedAt - Thời gian cập nhật
 * @property {string} blog_image - URL ảnh đại diện của bài viết
 */
interface IBlog extends Document {
    _id: Types.ObjectId;
    title: string;
    slug: string;
    tags: string[];
    content: string;
    author: string;
    meta: SEOInfo;
    publishedAt: Date;
    updatedAt: Date;
    blog_image: string; // Ảnh đại diện của bài viết
}

/**
 * @schema BlogSchema
 * @description Schema cho collection Blog trong MongoDB
 */
const BlogSchema: Schema = new Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề bài viết không được để trống'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Slug không được để trống'],
        unique: true,
        trim: true
    },
    tags: [{
        type: String,
        required: [true, 'Thẻ không được để trống'],
        trim: true
    }],
    content: {
        type: String,
        required: [true, 'Nội dung bài viết không được để trống']
    },
    author: {
        type: String,
        required: [true, 'Tác giả không được để trống'],
        trim: true
    },
    meta: {
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
    },
    publishedAt: {
        type: Date,
        default: Date.now
    },
    blog_image: {
        type: String,
        required: [true, 'Ảnh đại diện không được để trống']
    }
}, {
    timestamps: true,
    versionKey: false
});

// Tạo model từ schema
const BlogModel = mongoose.model<IBlog>('Blog', BlogSchema);

/**
 * @class Blog
 * @description Class mở rộng cho model Blog chứa các static methods
 */
class Blog {
    /**
     * @static getBlogs
     * @description Lấy danh sách bài viết với phân trang và bộ lọc
     * @param {Object} options - Các tùy chọn lọc và phân trang
     * @returns {Promise<{blogs: IBlog[], total: number}>} - Danh sách bài viết và tổng số
     */
    static async getBlogs(options: {
        page?: number;
        limit?: number;
        tags?: string[];
        sortBy?: 'publishedAt' | 'title';
        sortOrder?: 'asc' | 'desc';
    }): Promise<{blogs: IBlog[], total: number}> {
        try {
            const {
                page = 1,
                limit = 10,
                tags,
                sortBy = 'publishedAt',
                sortOrder = 'desc'
            } = options;

            // Xây dựng query
            const query: any = {};

            // Lọc theo tags
            if (tags && tags.length > 0) {
                query.tags = { $in: tags };
            }

            // Xây dựng sort
            const sort: any = {};
            switch (sortBy) {
                case 'title':
                    sort.title = sortOrder === 'asc' ? 1 : -1;
                    break;
                case 'publishedAt':
                    sort.publishedAt = sortOrder === 'asc' ? 1 : -1;
                    break;
            }

            // Thực hiện query
            const skip = (page - 1) * limit;
            const [blogs, total] = await Promise.all([
                BlogModel.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit),
                BlogModel.countDocuments(query)
            ]);

            return { blogs, total };
        } catch (error) {
            throw error;
        }
    }

    /**
     * @static getBlogBySlug
     * @description Lấy chi tiết bài viết theo slug
     * @param {string} slug - Slug của bài viết
     * @returns {Promise<IBlog | null>} - Thông tin chi tiết bài viết
     */
    static async getBlogBySlug(slug: string): Promise<IBlog | null> {
        try {
            return await BlogModel.findOne({ slug });
        } catch (error) {
            throw error;
        }
    }
}

export { BlogModel, IBlog, Blog }; 