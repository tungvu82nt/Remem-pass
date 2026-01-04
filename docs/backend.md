
# Tài liệu Kiến trúc Backend (Đề xuất) - SecurePass Vault

## 1. Mô hình Bảo mật Zero-Knowledge
Để đảm bảo an toàn tuyệt đối, Backend được thiết kế theo mô hình **Zero-Knowledge Encryption**:
- **Master Password:** Không bao giờ được gửi lên Server.
- **Encryption Key:** Một khóa đối xứng (AES-256-GCM) được tạo ra ở Client từ Master Password bằng thuật toán PBKDF2 hoặc Argon2.
- **Data at Rest:** Dữ liệu Vault (mật khẩu, ghi chú) được mã hóa tại Client trước khi gửi lên Backend. Server chỉ lưu trữ các "blobs" dữ liệu đã mã hóa.

## 2. Tech Stack Đề xuất
- **Runtime:** Node.js với Express hoặc Fastify.
- **Database:** PostgreSQL (Lưu trữ quan hệ cho User/Metadata) & Redis (Caching/Rate Limiting).
- **Authentication:** JWT (JSON Web Tokens) với cơ chế Rotate Refresh Token.
- **API Gateway:** Nginx hoặc Kong hỗ trợ SSL termination và DDoS protection.

## 3. Cấu trúc Cơ sở Dữ liệu (Schema)
### Table: `users`
- `id`: UUID (Primary Key)
- `email`: String (Unique, Index)
- `password_hash`: String (Sử dụng Argon2 cho login password)
- `encryption_salt`: String (Dùng cho quá trình phái sinh khóa ở Client)
- `created_at`: Timestamp

### Table: `vault_items`
- `id`: UUID
- `user_id`: UUID (Foreign Key)
- `type`: Enum ('login', 'card', 'note')
- `name`: String (Plaintext metadata)
- `encrypted_data`: Text (JSON string đã mã hóa AES-256-GCM)
- `is_favorite`: Boolean
- `last_used`: Timestamp

## 4. API Endpoints (RESTful)
### Authentication
- `POST /api/v1/auth/register`: Đăng ký người dùng mới.
- `POST /api/v1/auth/login`: Xác thực và cấp phát JWT.
- `POST /api/v1/auth/refresh`: Làm mới token.

### Vault Management
- `GET /api/v1/vault`: Lấy danh sách các blobs đã mã hóa.
- `POST /api/v1/vault`: Lưu mục mới (dữ liệu đã mã hóa từ Client).
- `PUT /api/v1/vault/:id`: Cập nhật mục hiện có.
- `DELETE /api/v1/vault/:id`: Xóa mục.

## 5. Quy trình Bảo mật Nâng cao
- **Rate Limiting:** Giới hạn 5 lần đăng nhập sai/phút trên mỗi IP để chống Brute-force.
- **Audit Logging:** Ghi lại mọi hoạt động truy cập (IP, Device, Time) nhưng không ghi lại dữ liệu nhạy cảm.
- **Bcrypt/Argon2:** Băm mật khẩu đăng nhập với salt riêng biệt cho từng người dùng.
- **End-to-End Encryption (E2EE):** Toàn bộ kênh truyền dẫn sử dụng TLS 1.3.

## 6. Khả năng mở rộng (Scalability)
- **Stateless API:** Dễ dàng mở rộng theo chiều ngang (Horizontal Scaling) bằng cách thêm các node server phía sau Load Balancer.
- **Database Sharding:** Phân mảnh dữ liệu theo `user_id` nếu số lượng người dùng vượt quá 10 triệu.
