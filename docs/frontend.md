
# Tài liệu Kiến trúc Frontend - SecurePass Vault

## 1. Tổng quan Công nghệ (Tech Stack)
- **Framework:** React 19 (ES6 Modules)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS 3.x với mô hình Utility-first.
- **AI Integration:** @google/genai (Gemini 3 Flash/Pro)
- **Icons:** Material Symbols Outlined (Google Fonts)
- **Fonts:** Plus Jakarta Sans (Display) & Noto Sans (Body)

## 2. Kiến trúc Thành phần (Component Architecture)
Hệ thống được thiết kế theo mô hình **Atomic Design** thu gọn:
- **Core (App.tsx):** Đóng vai trò là "Orchestrator", quản lý Router (State-based), Global State, và xử lý Logic nghiệp vụ chính (CRUD, Audit).
- **Sidebar.tsx:** Thành phần điều hướng thông minh, hỗ trợ Responsive (Mobile Drawer) và quản lý trạng thái hiển thị.
- **Services (geminiService.ts):** Lớp trừu tượng (Abstraction Layer) giao tiếp với Google Gemini API.

## 3. Quản lý Trạng thái (State Management)
- **Persistence Layer:** Sử dụng `localStorage` kết hợp với `useEffect` để đồng bộ hóa dữ liệu vault và cấu hình người dùng (ngôn ngữ, theme).
- **Memoization:** Sử dụng `useMemo` để tính toán "Vault Health Score" và "Audit Reports" một cách hiệu quả, tránh re-render không cần thiết khi dữ liệu vault lớn.
- **UI State:** Quản lý Modal, Toast, và Mobile Menu thông qua các React hooks tập trung.

## 4. Tích hợp AI (Gemini SDK)
- **Security Tips:** Hệ thống gọi model `gemini-3-flash-preview` để tạo các mẹo bảo mật tùy ngữ cảnh và ngôn ngữ.
- **Password Analysis:** Sử dụng `responseSchema` của Gemini để ép kiểu dữ liệu trả về dạng JSON chuẩn, phân tích độ mạnh mật khẩu và đưa ra hướng dẫn cải thiện.

## 5. UI/UX & Aesthetics
- **Dark Mode:** Hỗ trợ Class-based dark mode với bảng màu `background-dark (#101622)` và `surface-dark (#1e293b)`.
- **Animations:** Sử dụng plugin `tailwindcss-animate` cho các hiệu ứng `fade-in`, `zoom-in`, và `slide-in-from-bottom`.
- **Micro-interactions:** Hiệu ứng hover scale, active state trên các phím bấm và copy-to-clipboard feedback (Toast).
- **i18n:** Kiến trúc đa ngôn ngữ (VI, EN, ZH) dựa trên object mapping động, cho phép chuyển đổi ngôn ngữ không cần load lại trang.

## 6. Hiệu năng & Bảo mật Frontend
- **Sanitization:** Dữ liệu người dùng nhập vào được xử lý qua React để tránh XSS.
- **Performance:** Không sử dụng thư viện ngoài nặng nề, ưu tiên ESM để tối ưu hóa thời gian tải.
