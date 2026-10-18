# Cú Học Bài – Web trắc nghiệm

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
firebase deploy      # hosting + firestore.rules + firestore.indexes.json
```
Web chạy tại https://trac-nghiem-4804e.web.app. Index Firestore cần vài phút để build sau lần deploy đầu.

## Định dạng "Thêm nhanh"
```
Câu 1: Nội dung câu hỏi
A. Đáp án
*B. Đáp án đúng (dấu * ở đầu hoặc cuối, nhiều đáp án đúng cũng được)
> Ghi chú / giải thích
```
Mỗi câu cách nhau 1 dòng trống.
