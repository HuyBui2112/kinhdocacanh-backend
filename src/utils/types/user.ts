// Tên người dùng
export interface UserName {
    lastname: string;
    firstname: string;
}

// Thông tin người dùng
export interface UserInfo {
    username: UserName;
    phone: string;
    address: string;
}

// Thông tin xác thực người dùng
export interface AuthInfo {
    email: string;
    password: string;
}

// Response cho "Đăng ký" và "Đăng nhập"
export interface AuthResponse {
    _id: string;
    email: string;
    info_user: UserInfo;
    token: string;
}

// Response cho "Sửa thông tin người dùng"
export interface UpdateInfoUserResponse {
    _id: string;
    email: string;
    info_user: UserInfo;
}