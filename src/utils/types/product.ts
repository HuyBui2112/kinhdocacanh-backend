import { Types } from "mongoose";

// Giá sản phẩm
export interface Price {
    origin_price: number;
    discount: number;
    sell_price: number;
}

// Ảnh sản phẩm
export interface Image {
    url: string;
    alt: string;
}

// Thông tin SEO Meta
export interface SEOInfo {
    title: string;
    metaDescription: string;
    keywords: string[];
    canonical: string;
    image: string;

    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogType: string;

    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string;
}

// Response cho "Lấy danh sách sản phẩm"
export interface ProductsResponse {
    _id: Types.ObjectId;
    name: string;
    slug: string;
    category: string;
    imageFirst: string;
    price: Price;
    avgRating: number;
    numReviews: number;
    updatedAt: Date;
}