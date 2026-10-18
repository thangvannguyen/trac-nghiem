import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  linkWithPopup,
  linkWithRedirect,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { collection, doc, getDocs, increment, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { track } from './analytics';
import { emailKey as hashEmail } from './emailKey';

interface AuthState {
  /** Người dùng đã đăng nhập Google (null nếu là khách). */
  user: User | null;
  /** UID để lưu tiến độ & thống kê – có cả khách (tài khoản ẩn danh). */
  uid: string | undefined;
  isGuest: boolean;
  loading: boolean;
  email: string;
  /** Mã băm email đã xác minh (dùng để kiểm tra quyền được mời). */
  emailKey: string;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function saveProfile(u: User) {
  return setDoc(
    doc(db, 'users', u.uid),
    {
      displayName: u.displayName ?? '',
      email: (u.email ?? '').toLowerCase(),
      photoURL: u.photoURL ?? '',
      isAnonymous: u.isAnonymous,
      createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime) : null,
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  ).catch(console.error);
}

/** Đọc toàn bộ tiến độ / thống kê của tài khoản khách (khi còn đang là khách). */
async function readGuestData(uid: string) {
  const [progress, days, sessions] = await Promise.all(
    ['progress', 'days', 'sessions'].map((c) => getDocs(collection(db, 'users', uid, c))),
  );
  return { progress: progress.docs, days: days.docs, sessions: sessions.docs };
}

/** Cộng dồn dữ liệu khách vào tài khoản Google đã có sẵn. */
async function mergeGuestData(toUid: string, data: Awaited<ReturnType<typeof readGuestData>>) {
  const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [];
  const inc = (m: Record<string, number> | undefined) =>
    Object.fromEntries(Object.entries(m ?? {}).map(([k, v]) => [k, increment(v)]));

  for (const d of data.progress) {
    const v = d.data();
    const stats = Object.fromEntries(
      Object.entries((v.stats ?? {}) as Record<string, { right: number; wrong: number; lastAt: number }>).map(([q, s]) => [
        q,
        { right: increment(s.right), wrong: increment(s.wrong), lastAt: s.lastAt },
      ]),
    );
    ops.push((b) => b.set(doc(db, 'users', toUid, 'progress', d.id), { folderName: v.folderName ?? '', stats }, { merge: true }));
  }
  for (const d of data.days) {
    const v = d.data();
    ops.push((b) =>
      b.set(
        doc(db, 'users', toUid, 'days', d.id),
        { date: v.date, answered: increment(v.answered ?? 0), correct: increment(v.correct ?? 0), hours: inc(v.hours), folders: inc(v.folders) },
        { merge: true },
      ),
    );
  }
  for (const d of data.sessions) ops.push((b) => b.set(doc(db, 'users', toUid, 'sessions', d.id), d.data()));

  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    ops.slice(i, i + 400).forEach((op) => op(b));
    await b.commit();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setVersion] = useState(0); // ép render lại khi tài khoản khách được nâng cấp (cùng UID)

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setCurrent(u);
        if (u) {
          setLoading(false);
          saveProfile(u);
        } else {
          // Chưa có ai đăng nhập: tạo tài khoản khách để tiến độ học vẫn được lưu trên database.
          signInAnonymously(auth).catch((e) => {
            console.error('Không tạo được tài khoản khách – hãy bật Anonymous trong Firebase Authentication.', e);
            setLoading(false);
          });
        }
      }),
    [],
  );

  const signIn = async () => {
    const cur = auth.currentUser;
    if (!cur?.isAnonymous) {
      try {
        await signInWithPopup(auth, googleProvider);
        track('login', { method: 'google' });
      } catch (e) {
        if ((e as { code?: string }).code === 'auth/popup-blocked') await signInWithRedirect(auth, googleProvider);
        else throw e;
      }
      return;
    }
    // Đang là khách: nối tài khoản khách với Google để giữ nguyên tiến độ (cùng UID).
    try {
      const res = await linkWithPopup(cur, googleProvider);
      track('sign_up', { method: 'google', from_guest: true });
      await saveProfile(res.user);
      setVersion((v) => v + 1);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/popup-blocked') return linkWithRedirect(cur, googleProvider);
      if (code !== 'auth/credential-already-in-use') throw e;
      // Google này đã có tài khoản: đăng nhập vào đó rồi cộng dồn dữ liệu khách sang.
      const cred = GoogleAuthProvider.credentialFromError(e as never);
      if (!cred) throw e;
      const guest = await readGuestData(cur.uid).catch(() => null);
      const res = await signInWithCredential(auth, cred);
      if (guest) await mergeGuestData(res.user.uid, guest).catch(console.error);
    }
  };

  const user = current && !current.isAnonymous ? current : null;
  // Chỉ công nhận email đã xác minh (khớp với luật bảo mật).
  const verifiedEmail = user?.emailVerified ? (user.email ?? '').toLowerCase() : '';
  const [key, setKey] = useState('');
  useEffect(() => {
    let alive = true;
    hashEmail(verifiedEmail).then((k) => alive && setKey(k));
    return () => {
      alive = false;
    };
  }, [verifiedEmail]);
  const value: AuthState = {
    user,
    uid: current?.uid,
    isGuest: !user,
    loading,
    email: verifiedEmail,
    emailKey: key,
    signIn,
    logOut: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
