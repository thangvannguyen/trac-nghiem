import { useCallback, useState } from 'react';
import { useDismiss } from '../lib/useDismiss';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site';
import { IconChart, IconFolder, IconHome, IconLogout, IconMoon, IconSettings, IconShield, IconSun, Owl } from '../icons';
import { saveTheme, useActiveSkin } from '../lib/theme';
import LoginButton from './LoginButton';
import PushButton from './PushButton';

const navCls = ({ isActive }: { isActive: boolean }) =>
  `btn px-3 py-2 ${isActive ? 'bg-lilac-100 text-lilac-500' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'}`;

export default function Navbar() {
  const { user, loading, logOut } = useAuth();
  const { role } = useSite();
  // Tên logo theo theme đang dùng (vd. Cú Học Bài, Cú Học Dược, Cú Chill).
  const brand = useActiveSkin().name;
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);
  const menuRef = useDismiss<HTMLDivElement>(menu, closeMenu);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
        <Link to="/" className="mr-auto flex items-center gap-2">
          <Owl size={40} />
          <span className="text-lg font-black leading-none sm:text-xl">
            {brand.split(' ')[0]} <span className="text-lilac-500">{brand.split(' ').slice(1).join(' ')}</span>
          </span>
        </Link>
        <NavLink to="/" end className={navCls}>
          <IconHome size={20} />
          <span className="hidden sm:inline">Khám phá</span>
        </NavLink>
        <NavLink to="/me" className={navCls}>
          <IconFolder size={20} />
          <span className="hidden sm:inline">Của tôi</span>
        </NavLink>
        <NavLink to="/stats" className={navCls}>
          <IconChart size={20} />
          <span className="hidden sm:inline">Thống kê</span>
        </NavLink>
        {role.isModerator && (
          <NavLink to="/admin" className={navCls} title={role.isAdmin ? 'Quản trị' : 'Kiểm duyệt'}>
            <IconShield size={20} />
            <span className="hidden md:inline">{role.isAdmin ? 'Admin' : 'Kiểm duyệt'}</span>
          </NavLink>
        )}
        <PushButton />
        {loading ? (
          <div className="h-10 w-10 animate-pulse rounded-full bg-ink/10" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center rounded-full ring-2 ring-lilac-300 transition hover:ring-4"
              onClick={() => setMenu((m) => !m)}
              aria-label="Tài khoản"
            >
              <Avatar url={user.photoURL} name={user.displayName} />
            </button>
            {menu && (
              <>
                <div className="animate-pop card absolute right-0 mt-2 w-60 p-2">
                  <div className="px-3 py-2">
                    <div className="truncate font-extrabold">{user.displayName}</div>
                    <div className="truncate text-sm text-ink/50">{user.email}</div>
                    <span className={`chip mt-1.5 ${role.isAdmin ? 'bg-lilac-500 text-white' : 'bg-ink/5 text-ink/60'}`}>
                      {role.isRoot ? 'Admin gốc' : role.isAdmin ? 'Admin' : role.isModerator ? 'Kiểm duyệt viên' : 'Người dùng'}
                    </span>
                  </div>
                  <button
                    className="btn-ghost w-full justify-start"
                    onClick={() => saveTheme(user.uid, document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark').catch(console.error)}
                  >
                    {document.documentElement.dataset.theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
                    {document.documentElement.dataset.theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                  </button>
                  <Link to="/settings" className="btn-ghost w-full justify-start" onClick={() => setMenu(false)}>
                    <IconSettings size={20} /> Cài đặt
                  </Link>
                  <button
                    className="btn-ghost w-full justify-start"
                    onClick={() => {
                      setMenu(false);
                      logOut();
                    }}
                  >
                    <IconLogout size={20} /> Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <NavLink to="/settings" className={navCls} title="Cài đặt" aria-label="Cài đặt">
              <IconSettings size={20} />
            </NavLink>
            <LoginButton compact />
          </>
        )}
      </div>
    </header>
  );
}

/** Ảnh người chia sẻ, hoặc chú cú khi họ chọn ẩn danh. */
export function OwnerChip({ owner, size = 20 }: { owner: { name: string; photo: string } | null; size?: number }) {
  return (
    <>
      {owner ? (
        <Avatar url={owner.photo} name={owner.name} size={size} />
      ) : (
        <span className="flex shrink-0 items-center justify-center rounded-full bg-lilac-100" style={{ width: size, height: size }}>
          <Owl size={size - 2} />
        </span>
      )}
      <span className="truncate">{owner ? owner.name : 'Ẩn danh'}</span>
    </>
  );
}

export function Avatar({ url, name, size = 36 }: { url: string | null; name: string | null; size?: number }) {
  if (url)
    return <img src={url} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full" />;
  return (
    <span
      className="flex items-center justify-center rounded-full bg-peach-300 font-black text-white"
      style={{ width: size, height: size }}
    >
      {(name ?? '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}
