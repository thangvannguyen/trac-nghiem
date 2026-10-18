# Cú Học Bài – Web trắc nghiệm

Bản chạy thật:
- Firebase Hosting: https://trac-nghiem-4804e.web.app
- GitHub Pages: https://thangvannguyen.github.io/trac-nghiem/ (tự deploy khi push lên `main`, xem `.github/workflows/pages.yml`)


Tạo thư mục câu hỏi trắc nghiệm, tự học / kiểm tra / ôn câu sai, chia sẻ riêng tư – qua link – công khai.
React + Vite + Tailwind + Firebase (Auth Google, Firestore realtime, Hosting).

## Chạy thử
```bash
npm install
npm run dev          # http://localhost:5173
npm test             # test bộ đọc "Thêm nhanh"
npm run test:rules   # test Security Rules (cần Java để chạy Firestore emulator)
```

## Cấu hình Firebase (làm 1 lần trong Console)
1. Authentication → Sign-in method → bật **Google**.
2. Firestore Database → Create database (production mode, region `asia-southeast1`).
3. Authentication → Settings → Authorized domains: thêm `localhost` (thường có sẵn) và domain riêng nếu có.

## Deploy
```bash
firebase login
npm run build
firebase deploy --only hosting,firestore   # web + firestore.rules + firestore.indexes.json
```
Dự án dùng gói Firebase miễn phí (Spark) nên **không** deploy Cloud Functions (thông báo đẩy đang tắt).
GitHub Pages tự build lại mỗi lần push lên nhánh `main`.
Web chạy tại https://trac-nghiem-4804e.web.app. Index Firestore cần vài phút để build sau lần deploy đầu.

## Định dạng "Thêm nhanh"
```
Câu 1: Nội dung câu hỏi
A. Đáp án
*B. Đáp án đúng (dấu * ở đầu hoặc cuối, nhiều đáp án đúng cũng được)
> Ghi chú / giải thích
```
Mỗi câu cách nhau 1 dòng trống.

## Bảo mật cấu hình
- **Khóa API web** (`apiKey` trong `src/lib/firebase.ts`) chỉ dùng được từ các tên miền:
  `trac-nghiem-4804e.web.app`, `trac-nghiem-4804e.firebaseapp.com`, `thangvannguyen.github.io`,
  `localhost:5173`, `localhost:4173`, `127.0.0.1:5173`.
  Thêm tên miền mới (vd. tên miền riêng) thì phải thêm vào:
  Google Cloud Console → APIs & Services → Credentials → *Browser key (auto created by Firebase)* → Website restrictions,
  và Firebase Console → Authentication → Settings → Authorized domains.
- **Dependabot** tự mở pull request cập nhật thư viện mỗi tuần (`.github/dependabot.yml`) và cảnh báo lỗ hổng.
