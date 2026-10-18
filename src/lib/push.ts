import { useCallback, useEffect, useState } from 'react';
import { deleteToken, getMessaging, getToken, isSupported } from 'firebase/messaging';
import { collection, deleteDoc, doc, getCountFromServer, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';
import { BASE } from './basePath';
import { track } from './analytics';

/*
 * Thông báo đẩy (Web Push qua Firebase Cloud Messaging): hiện như thông báo của ứng dụng,
 * kể cả khi đã đóng tab. Mỗi thiết bị bật thông báo có 1 token lưu ở pushTokens/{token}.
 * Việc GỬI do Cloud Function (functions/index.js) thực hiện khi admin đăng / hiện lại thông báo.
 */

/**
 * Khóa VAPID (Web Push certificate) – lấy ở Firebase Console → Project settings → Cloud Messaging
 * → Web Push certificates → Generate key pair. Để trống thì tính năng thông báo đẩy được ẩn đi.
 */
export const FCM_VAPID_KEY = '';

export const pushConfigured = () => FCM_VAPID_KEY.length > 0;

const SW_URL = `${BASE}firebase-messaging-sw.js`;

async function registration() {
  return navigator.serviceWorker.register(SW_URL);
}

async function currentToken() {
  const messaging = getMessaging(app);
  return getToken(messaging, { vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: await registration() });
}

async function saveToken(token: string, uid: string, guest: boolean) {
  await setDoc(
    doc(db, 'pushTokens', token),
    { uid, guest, ua: navigator.userAgent.slice(0, 200), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export type PushState = 'unsupported' | 'unconfigured' | 'denied' | 'off' | 'on' | 'loading';

/** Trạng thái thông báo đẩy trên thiết bị này + bật / tắt. */
export function usePush(uid: string | undefined, guest: boolean) {
  const [state, setState] = useState<PushState>('loading');

  const refresh = useCallback(async () => {
    if (!pushConfigured()) return setState('unconfigured');
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !(await isSupported().catch(() => false)))
      return setState('unsupported');
    if (Notification.permission === 'denied') return setState('denied');
    if (Notification.permission !== 'granted' || !uid) return setState('off');
    try {
      const token = await currentToken();
      const snap = await getDoc(doc(db, 'pushTokens', token)).catch(() => null);
      if (snap?.exists()) {
        // Đồng bộ lại chủ sở hữu (vd. khách vừa đăng nhập Google).
        if (snap.data().uid !== uid || snap.data().guest !== guest) await saveToken(token, uid, guest);
        setState('on');
      } else setState('off');
    } catch (e) {
      console.error(e);
      setState('off');
    }
  }, [uid, guest]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!uid) throw new Error('no-uid');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      setState(perm === 'denied' ? 'denied' : 'off');
      throw new Error('permission-' + perm);
    }
    const token = await currentToken();
    await saveToken(token, uid, guest);
    track('enable_push');
    setState('on');
  }, [uid, guest]);

  const disable = useCallback(async () => {
    try {
      const token = await currentToken();
      await deleteDoc(doc(db, 'pushTokens', token)).catch(() => {});
      await deleteToken(getMessaging(app));
    } finally {
      setState('off');
    }
  }, []);

  return { state, enable, disable };
}

/** Số thiết bị đã bật thông báo đẩy (cho admin). */
export async function countPushDevices() {
  return (await getCountFromServer(collection(db, 'pushTokens'))).data().count;
}
