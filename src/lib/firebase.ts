import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Cấu hình web của Firebase là thông tin công khai; dữ liệu được bảo vệ bởi firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyBQRozrzs8CkGG7dlra9h1efGdn5RqA7to',
  authDomain: 'trac-nghiem-4804e.firebaseapp.com',
  projectId: 'trac-nghiem-4804e',
  storageBucket: 'trac-nghiem-4804e.firebasestorage.app',
  messagingSenderId: '882725261750',
  appId: '1:882725261750:web:e17668e551538d84ca7117',
  measurementId: 'G-336S3TVNJW',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Cache offline: mở lại trang sẽ hiện dữ liệu ngay, rồi đồng bộ realtime.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
