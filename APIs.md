# API Documentation - Kinh Đô Cá Cảnh

## Tổng quan

Document này mô tả chi tiết các API endpoints cho hệ thống Kinh Đô Cá Cảnh, bao gồm cấu trúc request và response.

### Base URL

```
http://localhost:5000/api
```

### Định dạng Response

Tất cả API đều trả về response có cấu trúc chuẩn như sau:

#### Thành công

```json
{
  "status": "success",
  "message": "Thông báo thành công",
  "data": {
    // Dữ liệu trả về
  }
}
```

#### Lỗi

```json
{
  "status": "fail",
  "error": {
    "statusCode": 400, // Mã lỗi HTTP
    "status": "fail",
    "isOperational": true
  },
  "message": "Thông báo lỗi"
}
```

### Xác thực

Hầu hết các endpoints đều yêu cầu xác thực. Xác thực được thực hiện bằng cách thêm header `Authorization` vào request:

```
Authorization: Bearer <token>
```

Token được lấy từ API đăng nhập hoặc đăng ký.

---

## API Endpoints

### 1. Đăng ký tài khoản

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "info_user": {
    "username": {
      "lastname": "Nguyễn", 
      "firstname": "Văn A"
    },
    "phone": "0123456789",
    "address": "123 Đường ABC, Quận XYZ, TP.HCM"
  },
  "info_auth": {
    "email": "example@gmail.com",
    "password": "Password123!"
  }
}
```

**Quy tắc xác thực:**
- Họ và tên không được để trống
- Số điện thoại phải có 10 chữ số
- Địa chỉ không được để trống
- Email phải hợp lệ và không trùng lặp
- Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt

**Response thành công (201):**
```json
{
  "status": "success",
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "email": "example@gmail.com",
    "info_user": {
      "username": {
        "lastname": "Nguyễn",
        "firstname": "Văn A"
      },
      "phone": "0123456789",
      "address": "123 Đường ABC, Quận XYZ, TP.HCM"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response lỗi:**
- Email đã tồn tại (400)
- Thiếu thông tin (400)
- Email không hợp lệ (400)
- Mật khẩu yếu (400)

---

### 2. Đăng nhập

**Endpoint:** `POST /auth/login`

**Request Body:** (Hỗ trợ 2 format)

Format 1:
```json
{
  "info_auth": {
    "email": "example@gmail.com",
    "password": "Password123!"
  }
}
```

Format 2:
```json
{
  "email": "example@gmail.com",
  "password": "Password123!"
}
```

**Response thành công (200):**
```json
{
  "status": "success",
  "message": "Đăng nhập thành công",
  "data": {
    "email": "example@gmail.com",
    "info_user": {
      "username": {
        "lastname": "Nguyễn",
        "firstname": "Văn A"
      },
      "phone": "0123456789",
      "address": "123 Đường ABC, Quận XYZ, TP.HCM"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response lỗi:**
- Email/mật khẩu không đúng (401)
- Thiếu thông tin (400)

---

### 3. Xem thông tin cá nhân

**Endpoint:** `GET /users/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response thành công (200):**
```json
{
  "status": "success",
  "data": {
    "email": "example@gmail.com",
    "info_user": {
      "username": {
        "lastname": "Nguyễn",
        "firstname": "Văn A"
      },
      "phone": "0123456789",
      "address": "123 Đường ABC, Quận XYZ, TP.HCM"
    }
  }
}
```

**Response lỗi:**
- Không có token (401)
- Token không hợp lệ (401)

---

### 4. Cập nhật thông tin cá nhân

**Endpoint:** `PATCH /users/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:** (Cập nhật một hoặc nhiều trường)
```json
{
  "info_user": {
    "username": {
      "lastname": "Trần",
      "firstname": "Văn B"
    },
    "phone": "0987654321",
    "address": "456 Đường XYZ, Quận ABC, TP.HCM"
  }
}
```

**Response thành công (200):**
```json
{
  "status": "success",
  "message": "Cập nhật thông tin thành công",
  "data": {
    "email": "example@gmail.com",
    "info_user": {
      "username": {
        "lastname": "Trần",
        "firstname": "Văn B"
      },
      "phone": "0987654321",
      "address": "456 Đường XYZ, Quận ABC, TP.HCM"
    }
  }
}
```

**Response lỗi:**
- Không có thông tin cập nhật (400)
- Số điện thoại không hợp lệ (400)
- Lỗi xác thực (401)

---

### 5. Đổi mật khẩu

**Endpoint:** `PATCH /users/change-password`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**Response thành công (200):**
```json
{
  "status": "success",
  "message": "Đổi mật khẩu thành công"
}
```

**Response lỗi:**
- Thiếu thông tin (400)
- Mật khẩu hiện tại không đúng (400)
- Mật khẩu mới quá ngắn (400)
- Lỗi xác thực (401)

---

### 6. Quản lý sản phẩm

#### 6.1. Lấy danh sách sản phẩm

**Endpoint:** `GET /products`

**Query Parameters:**
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số sản phẩm mỗi trang (mặc định: 10)
- `category` (optional): Lọc theo loại sản phẩm
- `minPrice` (optional): Giá tối thiểu
- `maxPrice` (optional): Giá tối đa
- `inStock` (optional): Lọc theo còn hàng/hết hàng (true/false)
- `sortBy` (optional): Sắp xếp theo (name/price/rating)
- `sortOrder` (optional): Thứ tự sắp xếp (asc/desc)

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "product_id",
        "name": "Tên sản phẩm",
        "slug": "ten-san-pham",
        "category": "Loại sản phẩm",
        "imageFirst": "url_ảnh_đầu_tiên",
        "price": {
          "origin_price": 1000000,
          "discount": 10,
          "sell_price": 900000
        },
        "avgRating": 4.5,
        "numReviews": 10,
        "updatedAt": "2024-03-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

#### 6.2. Tìm kiếm sản phẩm

**Endpoint:** `GET /products/search`

**Query Parameters:**
- `keyword`: Từ khóa tìm kiếm

**Response thành công (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Tên sản phẩm",
      "slug": "ten-san-pham",
      "category": "Loại sản phẩm",
      "imageFirst": "url_ảnh_đầu_tiên",
      "price": {
        "origin_price": 1000000,
        "discount": 10,
        "sell_price": 900000
      },
      "avgRating": 4.5,
      "numReviews": 10,
      "updatedAt": "2024-03-20T10:00:00.000Z"
    }
  ]
}
```

#### 6.3. Lấy chi tiết sản phẩm

**Endpoint:** `GET /products/:id`

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "pd_name": "Tên sản phẩm",
    "pd_slug": "ten-san-pham",
    "pd_category": "Loại sản phẩm",
    "pd_image": [
      {
        "url": "url_ảnh",
        "alt": "mô_tả_ảnh"
      }
    ],
    "pd_description": "Mô tả sản phẩm",
    "pd_price": {
      "origin_price": 1000000,
      "discount": 10,
      "sell_price": 900000
    },
    "pd_stock": 100,
    "pd_avgRating": 4.5,
    "pd_numReviews": 10,
    "pd_meta": {
      "title": "Meta title",
      "metaDescription": "Meta description",
      "keywords": ["keyword1", "keyword2"],
      "canonical": "/products/ten-san-pham",
      "image": "meta_image_url",
      "ogTitle": "OG title",
      "ogDescription": "OG description",
      "ogImage": "og_image_url",
      "ogType": "product",
      "twitterTitle": "Twitter title",
      "twitterDescription": "Twitter description",
      "twitterImage": "twitter_image_url"
    },
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 6.4. Tạo sản phẩm mới

**Endpoint:** `POST /products`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "pd_name": "Tên sản phẩm",
  "pd_slug": "ten-san-pham",
  "pd_category": "Loại sản phẩm",
  "pd_price": 1000000,
  "pd_image": [
    {
      "url": "url_ảnh",
      "alt": "mô_tả_ảnh"
    }
  ],
  "pd_description": "Mô tả sản phẩm",
  "pd_stock": 100,
  "pd_specifications": "Thông số kỹ thuật"
}
```

**Response thành công (201):**
```json
{
  "success": true,
  "message": "Tạo sản phẩm thành công",
  "data": {
    // Thông tin sản phẩm đã tạo
  }
}
```

### 7. Quản lý đánh giá

#### 7.1. Tạo đánh giá mới

**Endpoint:** `POST /reviews`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "productId": "product_id",
  "rating": 5,
  "comment": "Đánh giá sản phẩm"
}
```

**Response thành công (201):**
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "user_id": "user_id",
    "product_id": "product_id",
    "raing": 5,
    "comment": "Đánh giá sản phẩm",
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 7.2. Cập nhật đánh giá

**Endpoint:** `PUT /reviews/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "rating": 4,
  "comment": "Cập nhật đánh giá"
}
```

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "_id": "review_id",
    "user_id": "user_id",
    "product_id": "product_id",
    "raing": 4,
    "comment": "Cập nhật đánh giá",
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 7.3. Xóa đánh giá

**Endpoint:** `DELETE /reviews/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Xóa đánh giá thành công"
}
```

#### 7.4. Lấy danh sách đánh giá của sản phẩm

**Endpoint:** `GET /reviews/products/:productId/reviews`

**Query Parameters:**
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số đánh giá mỗi trang (mặc định: 10)

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "review_id",
        "user_id": {
          "info_user": {
            "username": {
              "lastname": "Nguyễn",
              "firstname": "Văn A"
            }
          }
        },
        "raing": 5,
        "comment": "Đánh giá sản phẩm",
        "createdAt": "2024-03-20T10:00:00.000Z",
        "updatedAt": "2024-03-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### 8. Quản lý Giỏ hàng

#### 8.1. Lấy thông tin giỏ hàng

**Endpoint:** `GET /api/v1/cart`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin giỏ hàng thành công.",
  "data": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "name": "Tên sản phẩm",
        "image": "url_ảnh",
        "price": 150000,
        "quantity": 2
      }
    ],
    "totalPrice": 300000,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 8.2. Thêm sản phẩm vào giỏ hàng

**Endpoint:** `POST /api/v1/cart/items`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "productId": "product_id",
  "quantity": 2
}
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Thêm sản phẩm vào giỏ hàng thành công.",
  "data": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "name": "Tên sản phẩm",
        "image": "url_ảnh",
        "price": 150000,
        "quantity": 2
      }
    ],
    "totalPrice": 300000,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 8.3. Cập nhật toàn bộ giỏ hàng

**Endpoint:** `PUT /api/v1/cart`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id1",
      "quantity": 2
    },
    {
      "productId": "product_id2",
      "quantity": 1
    }
  ]
}
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Cập nhật giỏ hàng thành công.",
  "data": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id1",
        "name": "Tên sản phẩm 1",
        "image": "url_ảnh_1",
        "price": 150000,
        "quantity": 2
      },
      {
        "productId": "product_id2",
        "name": "Tên sản phẩm 2",
        "image": "url_ảnh_2",
        "price": 200000,
        "quantity": 1
      }
    ],
    "totalPrice": 500000,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 8.4. Cập nhật số lượng một sản phẩm trong giỏ

**Endpoint:** `PUT /api/v1/cart/items/:productId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Cập nhật sản phẩm trong giỏ hàng thành công.",
  "data": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "name": "Tên sản phẩm",
        "image": "url_ảnh",
        "price": 150000,
        "quantity": 3
      }
    ],
    "totalPrice": 450000,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 8.5. Xóa một sản phẩm khỏi giỏ hàng

**Endpoint:** `DELETE /api/v1/cart/items/:productId`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Xóa sản phẩm khỏi giỏ hàng thành công.",
  "data": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [],
    "totalPrice": 0,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 8.6. Xóa toàn bộ giỏ hàng

**Endpoint:** `DELETE /api/v1/cart`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Xóa toàn bộ giỏ hàng thành công.",
  "data": {
    "_id": "cart_id",
    "userId": "user_id",
    "items": [],
    "totalPrice": 0,
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

### 9. Quản lý Đơn hàng

#### 9.1. Tạo đơn hàng mới

**Endpoint:** `POST /api/v1/orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "shippingAddress": {
    "fullname": "Nguyễn Văn A",
    "address": "123 Đường ABC, Quận XYZ, TP.HCM",
    "phone": "0123456789",
    "city": "TP.HCM",
    "postalCode": "70000"
  },
  "paymentMethod": "COD"
}
```

**Response thành công (201):**
```json
{
  "success": true,
  "message": "Đặt hàng thành công.",
  "data": {
    "_id": "order_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "name": "Tên sản phẩm",
        "image": "url_ảnh",
        "price": 150000,
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullname": "Nguyễn Văn A",
      "address": "123 Đường ABC, Quận XYZ, TP.HCM",
      "phone": "0123456789",
      "city": "TP.HCM",
      "postalCode": "70000"
    },
    "paymentMethod": "COD",
    "totalPrice": 300000,
    "status": "pending",
    "orderDate": "2024-03-20T10:00:00.000Z",
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 9.2. Lấy danh sách đơn hàng của người dùng

**Endpoint:** `GET /api/v1/orders/my-orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Lấy danh sách đơn hàng thành công.",
  "data": [
    {
      "_id": "order_id1",
      "userId": "user_id",
      "items": [
        {
          "productId": "product_id",
          "name": "Tên sản phẩm",
          "image": "url_ảnh",
          "price": 150000,
          "quantity": 2
        }
      ],
      "shippingAddress": {
        "fullname": "Nguyễn Văn A",
        "address": "123 Đường ABC, Quận XYZ, TP.HCM",
        "phone": "0123456789"
      },
      "paymentMethod": "COD",
      "totalPrice": 300000,
      "status": "pending",
      "orderDate": "2024-03-20T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### 9.3. Lấy chi tiết đơn hàng

**Endpoint:** `GET /api/v1/orders/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Lấy thông tin đơn hàng thành công.",
  "data": {
    "_id": "order_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "name": "Tên sản phẩm",
        "image": "url_ảnh",
        "price": 150000,
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullname": "Nguyễn Văn A",
      "address": "123 Đường ABC, Quận XYZ, TP.HCM",
      "phone": "0123456789",
      "city": "TP.HCM",
      "postalCode": "70000"
    },
    "paymentMethod": "COD",
    "totalPrice": 300000,
    "status": "pending",
    "orderDate": "2024-03-20T10:00:00.000Z",
    "createdAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 9.4. Hủy đơn hàng

**Endpoint:** `PUT /api/v1/orders/:id/cancel`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Hủy đơn hàng thành công.",
  "data": {
    "_id": "order_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "name": "Tên sản phẩm",
        "image": "url_ảnh",
        "price": 150000,
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullname": "Nguyễn Văn A",
      "address": "123 Đường ABC, Quận XYZ, TP.HCM",
      "phone": "0123456789"
    },
    "paymentMethod": "COD",
    "totalPrice": 300000,
    "status": "cancelled",
    "orderDate": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 9.5. Cập nhật trạng thái đơn hàng

**Endpoint:** `PUT /api/v1/orders/:id/status`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "status": "shipping"
}
```

**Response thành công (200):**
```json
{
  "success": true,
  "message": "Cập nhật trạng thái đơn hàng thành 'shipping' thành công.",
  "data": {
    "_id": "order_id",
    "userId": "user_id",
    "items": [
      {
        "productId": "product_id",
        "name": "Tên sản phẩm",
        "image": "url_ảnh",
        "price": 150000,
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullname": "Nguyễn Văn A",
      "address": "123 Đường ABC, Quận XYZ, TP.HCM",
      "phone": "0123456789"
    },
    "paymentMethod": "COD",
    "totalPrice": 300000,
    "status": "shipping",
    "orderDate": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

### Trạng thái đơn hàng

| Trạng thái | Mô tả |
|------------|-------|
| pending | Đơn hàng đang chờ xử lý, đang chuẩn bị |
| shipping | Đơn hàng đang được giao |
| delivered | Đơn hàng đã giao thành công |
| paid | Đơn hàng đã thanh toán |
| cancelled | Đơn hàng đã bị hủy |

**Lưu ý:**
- Chỉ có thể hủy đơn hàng khi đơn hàng đang ở trạng thái `pending`
- Người dùng chỉ có thể cập nhật hoặc hủy đơn hàng của chính họ
- API cập nhật trạng thái đơn hàng yêu cầu xác thực và người dùng phải là chủ đơn hàng

### 10. Quản lý Blog

#### 10.1. Lấy danh sách bài viết

**Endpoint:** `GET /api/v1/blogs`

**Query Parameters:**
- `page` (optional): Số trang (mặc định: 1)
- `limit` (optional): Số bài viết mỗi trang (mặc định: 10)
- `tags` (optional): Lọc theo tags (có thể truyền nhiều tags cách nhau bởi dấu phẩy, vd: "ca-betta,thuy-sinh")
- `sortBy` (optional): Sắp xếp theo (publishedAt/title)
- `sortOrder` (optional): Thứ tự sắp xếp (asc/desc)

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "blogs": [
      {
        "_id": "blog_id",
        "title": "Tiêu đề bài viết",
        "slug": "tieu-de-bai-viet",
        "tags": ["ca-canh", "huong-dan", "ca-betta"],
        "summary": "Tóm tắt bài viết được tự động tạo từ nội dung...",
        "author": "Tên tác giả",
        "publishedAt": "2024-03-20T10:00:00.000Z",
        "updatedAt": "2024-03-20T10:00:00.000Z",
        "image": "url_anh_dai_dien"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

#### 10.2. Lấy chi tiết bài viết

**Endpoint:** `GET /api/v1/blogs/:slug`

**Response thành công (200):**
```json
{
  "success": true,
  "data": {
    "_id": "blog_id",
    "title": "Tiêu đề bài viết",
    "slug": "tieu-de-bai-viet",
    "tags": ["ca-canh", "huong-dan", "ca-betta"],
    "content": [
      {
        "type": "heading",
        "content": "Tiêu đề đoạn",
        "level": 2
      },
      {
        "type": "paragraph",
        "content": "Nội dung đoạn văn..."
      },
      {
        "type": "image",
        "content": "Mô tả hình ảnh",
        "url": "đường_dẫn_hình_ảnh",
        "alt": "Mô tả hình ảnh"
      },
      {
        "type": "video",
        "content": "Mô tả video",
        "url": "đường_dẫn_video"
      }
    ],
    "author": "Tên tác giả",
    "meta": {
      "title": "Meta title",
      "metaDescription": "Meta description",
      "keywords": ["ca-canh", "huong-dan", "ca-betta"],
      "canonical": "/blogs/tieu-de-bai-viet",
      "image": "meta_image_url",
      "ogTitle": "OG title",
      "ogDescription": "OG description",
      "ogImage": "og_image_url",
      "ogType": "article",
      "twitterTitle": "Twitter title",
      "twitterDescription": "Twitter description",
      "twitterImage": "twitter_image_url"
    },
    "publishedAt": "2024-03-20T10:00:00.000Z",
    "updatedAt": "2024-03-20T10:00:00.000Z"
  }
}
```

#### 10.3. Tạo bài viết mới

**Endpoint:** `POST /api/v1/blogs`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Tiêu đề bài viết mới",
  "slug": "tieu-de-bai-viet-moi",
  "tags": ["tag1", "tag2"],
  "content": [
    {
      "type": "paragraph",
      "content": "Nội dung đoạn đầu tiên..."
    },
    {
      "type": "heading",
      "content": "Tiêu đề phụ",
      "level": 2
    }
    // Các block nội dung khác...
  ],
  "author": "Tên tác giả",
  "blog_image": "url_anh_dai_dien_moi",
  "meta": { 
    "title": "Meta title (optional)",
    "metaDescription": "Meta description (optional)",
    "keywords": ["keyword1"], // optional
    "canonical": "/blogs/tieu-de-bai-viet-moi", // optional
    "image": "meta_image_url", // optional, nếu không có sẽ lấy blog_image
    "ogTitle": "OG title (optional)",
    "ogDescription": "OG description (optional)",
    "ogImage": "og_image_url", // optional, nếu không có sẽ lấy blog_image
    "ogType": "article", // optional
    "twitterTitle": "Twitter title (optional)",
    "twitterDescription": "Twitter description (optional)",
    "twitterImage": "twitter_image_url" // optional, nếu không có sẽ lấy blog_image
  }
}
```

**Response thành công (201):**
```json
{
  "success": true,
  "message": "Tạo bài viết thành công",
  "data": {
    // Thông tin bài viết đã tạo
    "_id": "new_blog_id",
    "title": "Tiêu đề bài viết mới",
    "slug": "tieu-de-bai-viet-moi",
    "tags": ["tag1", "tag2"],
    "content": [...], // Nội dung đầy đủ
    "author": "Tên tác giả",
    "meta": {...},
    "publishedAt": "2024-03-20T11:00:00.000Z",
    "updatedAt": "2024-03-20T11:00:00.000Z",
    "blog_image": "url_anh_dai_dien_moi"
  }
}
```

## Các mã lỗi

| Mã lỗi | Mô tả |
|--------|-------|
| 400 | Bad Request - Yêu cầu không hợp lệ, thiếu dữ liệu hoặc dữ liệu không đúng định dạng |
| 401 | Unauthorized - Không có quyền truy cập, cần đăng nhập hoặc token không hợp lệ |
| 403 | Forbidden - Không có quyền thực hiện hành động này |
| 404 | Not Found - Không tìm thấy tài nguyên |
| 500 | Internal Server Error - Lỗi server |

---

## Xử lý lỗi

Tất cả các lỗi đều được trả về với cấu trúc chuẩn. Frontend nên xử lý các lỗi dựa trên mã lỗi HTTP và thông báo được trả về trong trường `message`.

```json
{
  "status": "fail",
  "error": {
    "statusCode": 400,
    "status": "fail",
    "isOperational": true
  },
  "message": "Thông báo lỗi cụ thể"
}
```

## Lưu ý

- Token JWT hết hạn sau 1 ngày
- Mật khẩu phải tuân theo quy tắc bảo mật (ít nhất 6 ký tự, chữ hoa, chữ thường, số, ký tự đặc biệt)
- Email phải là duy nhất trong hệ thống
