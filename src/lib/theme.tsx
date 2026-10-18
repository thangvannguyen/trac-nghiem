import { useEffect } from 'react';
import {
  doc,
} from 'firebase/firestore';
import { setDoc } from './fs'; // có đếm quota ước tính
import { db } from './firebase';
import { useAuth } from './auth';
import { useUserDoc } from './stats';
import { useSite } from './site';
import { mascotFor, skinById, type MascotId } from './skins';

/*
 * Chế độ Sáng / Tối. Lựa chọn của người dùng lưu trên database (users/{uid}.theme).
 * Trình duyệt chỉ nhớ thêm 1 bản sao "sáng/tối" để tô đúng màu ngay khi mở trang
 * (trước khi kịp tải cài đặt từ database) – tránh bị chớp trắng.
 */

export type ThemePref = 'light' | 'dark' | 'system';
const CACHE = 'theme-cache';
const SKIN_CACHE = 'skin-cache';
const NAME_CACHE = 'skin-name-cache';
const MASCOT_CACHE = 'mascot-cache';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export const resolveTheme = (p: ThemePref) => (p === 'system' ? (media().matches ? 'dark' : 'light') : p);

function apply(mode: 'light' | 'dark') {
  document.documentElement.dataset.theme = mode;
  try {
    localStorage.setItem(CACHE, mode);
  } catch {
    /* bộ nhớ trình duyệt bị chặn – vẫn hoạt động, chỉ có thể chớp màu khi mở trang */
  }
}

export const saveTheme = (uid: string, theme: ThemePref) => setDoc(doc(db, 'users', uid), { theme }, { merge: true });
export const saveSkin = (uid: string, skin: string | null) => setDoc(doc(db, 'users', uid), { skin }, { merge: true });

/** Theme đang áp dụng: theme riêng của người dùng (nếu admin cho phép) hoặc theme mặc định. */
export function useActiveSkin() {
  const { uid } = useAuth();
  const me = useUserDoc(uid);
  const { config, configLoaded } = useSite();
  // Chưa tải xong cài đặt: dùng theme + tên đã áp dụng lần trước (tránh tên / màu nhảy qua lại).
  if (!configLoaded || me.loading) {
    const cached = skinById(document.documentElement.dataset.skin);
    let name = '';
    try {
      name = localStorage.getItem(NAME_CACHE) ?? '';
    } catch {
      /* bỏ qua */
    }
    return name ? { ...cached, name } : cached;
  }
  const own = config.allowUserSkin ? me.data.skin : undefined;
  return skinById(own ?? config.defaultSkin, config.skinNames);
}

/** Kiểu chú cú đang dùng (theo cấu hình của theme hiện tại). */
export function useActiveMascot(): MascotId {
  const skin = useActiveSkin();
  const { uid } = useAuth();
  const me = useUserDoc(uid);
  const { config, configLoaded } = useSite();
  if (!configLoaded || me.loading) {
    try {
      const c = localStorage.getItem(MASCOT_CACHE);
      if (c) return c as MascotId;
    } catch {
      /* bỏ qua */
    }
  }
  return mascotFor(skin.id, config.skinMascots);
}

/** Gắn ở gốc ứng dụng: áp dụng chế độ theo cài đặt và theo dõi đổi chế độ của hệ điều hành. */
export function ThemeSync() {
  const { uid } = useAuth();
  const me = useUserDoc(uid);
  const pref: ThemePref = me.data.theme ?? 'system';

  useEffect(() => {
    if (me.loading) return;
    apply(resolveTheme(pref));
    if (pref !== 'system') return;
    const m = media();
    const onChange = () => apply(resolveTheme('system'));
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, [pref, me.loading]);

  // Theme (skin): chỉ áp dụng khi đã tải xong cài đặt của người dùng.
  const skin = useActiveSkin();
  const mascot = useActiveMascot();
  const { configLoaded } = useSite();
  useEffect(() => {
    if (me.loading || !configLoaded) return;
    document.documentElement.dataset.skin = skin.id;
    document.title = `${skin.name} – Trắc nghiệm`;
    try {
      localStorage.setItem(SKIN_CACHE, skin.id);
      localStorage.setItem(NAME_CACHE, skin.name);
      localStorage.setItem(MASCOT_CACHE, mascot);
    } catch {
      /* bỏ qua */
    }
  }, [skin.id, skin.name, mascot, me.loading, configLoaded]);

  return null;
}
