import mongoose, { Document, Schema, Types } from "mongoose";
import { UserInfo, AuthInfo } from "@/utils/types";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/**
 * @interface IUser
 * @description Interface định nghĩa kiểu dữ liệu cho đối tượng User trong MongoDB
 * @property {Types.ObjectId} _id - ID duy nhất của user
 * @property {UserInfo} info_user - Thông tin cá nhân của người dùng
 * @property {AuthInfo} info_auth - Thông tin xác thực của người dùng
 * @property {Date} createdAt - Thời gian tạo tài khoản
 * @property {Date} updatedAt - Thời gian cập nhật thông tin gần nhất
 */
interface IUser extends Document {
    _id: Types.ObjectId;
    info_user: UserInfo;
    info_auth: AuthInfo;
    createdAt: Date;
    updatedAt: Date;
    
    /**
     * @method comparePassword
     * @description So sánh mật khẩu đầu vào với mật khẩu đã hash
     * @param {string} password - Mật khẩu cần kiểm tra
     * @returns {Promise<boolean>} - True nếu mật khẩu khớp, False nếu không khớp
     */
    comparePassword(password: string): Promise<boolean>;
    
    /**
     * @method generateToken
     * @description Tạo JWT token cho user
     * @returns {string} - JWT token
     */
    generateToken(): string;
}

/**
 * @schema UserSchema
 * @description Schema cho collection User trong MongoDB
 */
const UserSchema: Schema = new Schema({
    info_user: {
        username: {
            lastname: { 
                type: String, 
                required: [true, 'Họ không được để trống'] 
            },
            firstname: { 
                type: String, 
                required: [true, 'Tên không được để trống'] 
            }
        },
        phone: { 
            type: String, 
            required: [true, 'Số điện thoại không được để trống'],
            validate: {
                validator: function(v: string) {
                    return /^\d{10}$/.test(v);
                },
                message: 'Số điện thoại không hợp lệ (phải có 10 chữ số)'
            }
        },
        address: { 
            type: String, 
            required: [true, 'Địa chỉ không được để trống'] 
        }
    },
    info_auth: {
        email: { 
            type: String, 
            required: [true, 'Email không được để trống'],
            validate: {
                validator: function(v: string) {
                    return v != null && /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
                },
                message: 'Email không hợp lệ hoặc để trống'
            }
        },
        password: { 
            type: String, 
            required: [true, 'Mật khẩu không được để trống'],
            minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

// Method kiểm tra mật khẩu
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
    try {
        // So sánh mật khẩu đầu vào với mật khẩu đã hash trong DB
        const isMatch = await bcrypt.compare(password, this.info_auth.password);
        return isMatch;
    } catch (error) {
        return false;
    }
};

// Method tạo JWT token
UserSchema.methods.generateToken = function(): string {
    const payload = {
        id: this._id,
        email: this.info_auth.email
    };
    
    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '1d' }
    );
};

// Thêm đoạn này sau định nghĩa schema
UserSchema.index({ 'info_auth.email': 1 }, { 
    unique: true,
    sparse: true // Bỏ qua các giá trị null
});

// Tạo model từ schema
const UserModel = mongoose.model<IUser>('User', UserSchema);

/**
 * @class User
 * @description Class mở rộng cho model User chứa các static methods
 */
class User {
    /**
     * @static register
     * @description Đăng ký người dùng mới
     * @param {UserInfo} userInfo - Thông tin cá nhân người dùng
     * @param {AuthInfo} authInfo - Thông tin xác thực
     * @returns {Promise<IUser>} - Đối tượng user đã tạo
     */
    static async register(userInfo: UserInfo, authInfo: AuthInfo): Promise<IUser> {
        try {
            console.log('Model nhận email:', authInfo?.email);
            
            const existingUser = await UserModel.findOne({ 'info_auth.email': authInfo.email });
            
            if (existingUser) {
                throw new Error('Email đã được sử dụng');
            }
            
            // Kiểm tra xem mật khẩu đã được hash bởi middleware chưa
            let hashedPassword = authInfo.password;
            
            // Nếu mật khẩu chưa được hash (không có $2b$ ở đầu - định dạng của bcrypt)
            if (!hashedPassword.startsWith('$2b$')) {
                // Hash mật khẩu
                const salt = await bcrypt.genSalt(10);
                hashedPassword = await bcrypt.hash(authInfo.password, salt);
            }
            
            const newUser = new UserModel({
                info_user: userInfo,
                info_auth: {
                    ...authInfo,
                    password: hashedPassword
                }
            });
            
            console.log('Trước khi lưu, email là:', newUser.info_auth?.email);
            return await newUser.save();
        } catch (error) {
            console.error('Lỗi trong quá trình register:', error);
            throw error;
        }
    }
    
    /**
     * @static login
     * @description Đăng nhập người dùng
     * @param {string} email - Email người dùng
     * @param {string} password - Mật khẩu người dùng
     * @returns {Promise<{user: IUser, token: string}>} - Đối tượng user và token
     */
    static async login(email: string, password: string): Promise<{user: IUser, token: string}> {
        try {
            // Tìm người dùng theo email
            const user = await UserModel.findOne({ 'info_auth.email': email });
            
            if (!user) {
                throw new Error('Email hoặc mật khẩu không chính xác');
            }
            
            // Kiểm tra mật khẩu
            const isMatch = await user.comparePassword(password);
            
            if (!isMatch) {
                throw new Error('Email hoặc mật khẩu không chính xác');
            }
            
            // Tạo token
            const token = user.generateToken();
            
            return { user, token };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    /**
     * @static updateUserInfo
     * @description Cập nhật thông tin người dùng
     * @param {string} userId - ID của người dùng
     * @param {Partial<UserInfo>} updateData - Dữ liệu cần cập nhật (có thể chỉ 1 phần)
     * @returns {Promise<IUser>} - Đối tượng user đã cập nhật
     */
    static async updateUserInfo(userId: string, updateData: Partial<UserInfo>): Promise<IUser | null> {
        try {
            const updateFields: Record<string, any> = {};
            
            // Cập nhật tên người dùng nếu có
            if (updateData.username) {
                if (updateData.username.lastname) {
                    updateFields['info_user.username.lastname'] = updateData.username.lastname;
                }
                
                if (updateData.username.firstname) {
                    updateFields['info_user.username.firstname'] = updateData.username.firstname;
                }
            }
            
            // Cập nhật số điện thoại nếu có
            if (updateData.phone) {
                // Kiểm tra định dạng số điện thoại
                if (!/^\d{10}$/.test(updateData.phone)) {
                    throw new Error('Số điện thoại không hợp lệ (phải có 10 chữ số)');
                }
                updateFields['info_user.phone'] = updateData.phone;
            }
            
            // Cập nhật địa chỉ nếu có
            if (updateData.address) {
                updateFields['info_user.address'] = updateData.address;
            }
            
            // Chỉ thực hiện cập nhật nếu có dữ liệu
            if (Object.keys(updateFields).length === 0) {
                throw new Error('Không có thông tin nào được cập nhật');
            }
            
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { $set: updateFields },
                { new: true, runValidators: true }
            );
            
            if (!updatedUser) {
                throw new Error('Không tìm thấy người dùng');
            }
            
            return updatedUser;
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * @static changePassword
     * @description Đổi mật khẩu người dùng
     * @param {string} userId - ID của người dùng
     * @param {string} currentPassword - Mật khẩu hiện tại
     * @param {string} newPassword - Mật khẩu mới
     * @returns {Promise<IUser>} - Đối tượng user đã cập nhật
     */
    static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<IUser> {
        try {
            const user = await UserModel.findById(userId);
            
            if (!user) {
                throw new Error('Không tìm thấy người dùng');
            }
            
            // Kiểm tra mật khẩu hiện tại
            const isMatch = await user.comparePassword(currentPassword);
            
            if (!isMatch) {
                throw new Error('Mật khẩu hiện tại không chính xác');
            }
            
            // Kiểm tra mật khẩu mới
            if (newPassword.length < 6) {
                throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
            }
            
            // Hash mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            
            // Cập nhật mật khẩu mới
            user.info_auth.password = hashedPassword;
            
            // Lưu
            return await user.save();
        } catch (error) {
            throw error;
        }
    }
}

export { UserModel, IUser, User };