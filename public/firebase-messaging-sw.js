/* Service worker nhận thông báo đẩy khi tab đã đóng / ẩn (Firebase Cloud Messaging). */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBQRozrzs8CkGG7dlra9h1efGdn5RqA7to',
  authDomain: 'trac-nghiem-4804e.firebaseapp.com',
  projectId: 'trac-nghiem-4804e',
  storageBucket: 'trac-nghiem-4804e.firebasestorage.app',
  messagingSenderId: '882725261750',
  appId: '1:882725261750:web:e17668e551538d84ca7117',
});

// Thông báo gửi kèm phần "notification" sẽ được SDK tự hiển thị khi trang không mở;
// bấm vào thông báo sẽ mở trang theo webpush.fcmOptions.link.
firebase.messaging();
