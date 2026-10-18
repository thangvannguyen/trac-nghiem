import { useEffect, useRef, useState, type ReactNode } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site';
import { useUserDoc } from '../lib/stats';
import { dismissNotice, noticeVisibleFor, useActiveNotices, type Notice } from '../lib/notices';
import { playChimeOnAppear } from '../lib/sound';
import NoticeView from './NoticeView';
import { IconBan, IconSettings } from '../icons';

/** Dải nhắc trạng thái nhỏ gọn (bảo trì, tài khoản bị khóa). */
function StatusStrip({ icon, tint, children }: { icon: ReactNode; tint: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-surface/90 px-3 py-2.5 shadow-soft">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
      <p className="text-sm font-bold leading-snug text-ink/75">{children}</p>
    </div>
  );
}

const keyOf = (n: Notice) => `${n.id}:${n.revision}`;

/** Các thông báo đang bật (theo mẫu hiển thị) + nhắc chế độ bảo trì / tài khoản bị khóa. */
export default function SiteBanner() {
  const { user, uid, loading: authLoading } = useAuth();
  const { config, role } = useSite();
  const me = useUserDoc(uid);
  const notices = useActiveNotices();
  const [hiddenNow, setHiddenNow] = useState<Set<string>>(new Set());

  // Chỉ quyết định khi đã tải xong tài khoản + danh sách đã đóng → không hiện chớp rồi biến mất khi tải lại trang.
  const known = !authLoading && !me.loading && !notices.loading;
  const dismissed = me.data.dismissedNotices ?? {};
  const visible = known
    ? notices.data.filter(
        (n) => n.text.trim() && noticeVisibleFor(n, user) && dismissed[n.id] !== n.revision && !hiddenNow.has(keyOf(n)),
      )
    : [];
  const muted = !!me.data.muteNotice;

  // Phát chuông đúng lúc thông báo mới xuất hiện (mỗi lần hiện 1 lần; đóng thì không phát).
  const chimed = useRef<Set<string>>(new Set());
  const fresh = visible.find((n) => n.sound && !chimed.current.has(keyOf(n)));
  useEffect(() => {
    if (!visible.length) return;
    visible.forEach((n) => chimed.current.add(keyOf(n)));
    if (!fresh || muted) return;
    return playChimeOnAppear(fresh.tone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.map(keyOf).join('|'), muted]);

  const close = (n: Notice) => {
    setHiddenNow((s) => new Set(s).add(keyOf(n)));
    if (uid) dismissNotice(uid, n).catch(console.error);
  };
  const toggleMute = uid
    ? () => setDoc(doc(db, 'users', uid), { muteNotice: !muted }, { merge: true }).catch(console.error)
    : undefined;
  const view = (n: Notice) => (
    <NoticeView
      key={keyOf(n)}
      title={n.title}
      text={n.text}
      tone={n.tone}
      template={n.template}
      muted={muted}
      onToggleMute={n.sound ? toggleMute : undefined}
      onClose={() => close(n)}
    />
  );

  const inline = visible.filter((n) => n.template !== 'popup' && n.template !== 'toast');
  const popup = visible.find((n) => n.template === 'popup');
  const toasts = visible.filter((n) => n.template === 'toast');
  const showReadOnly = config.readOnly;
  const showBanned = user && role.banned && !role.isAdmin;

  return (
    <>
      {(inline.length > 0 || showReadOnly || showBanned) && (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2.5 px-4 pt-4">
          {inline.map(view)}
          {showReadOnly && (
            <StatusStrip icon={<IconSettings size={20} />} tint="bg-peach-100 text-peach-500">
              {role.isAdmin
                ? 'Web đang ở chế độ bảo trì – người dùng thường tạm thời không thể tạo / sửa nội dung (admin vẫn sửa được).'
                : 'Web đang bảo trì: bạn vẫn học bình thường, nhưng tạm thời chưa tạo / sửa được thư mục và câu hỏi.'}
            </StatusStrip>
          )}
          {showBanned && (
            <StatusStrip icon={<IconBan size={20} />} tint="bg-rose-100 text-rose-500">
              Tài khoản của bạn đang bị khóa quyền tạo / sửa nội dung. Bạn vẫn có thể học các thư mục được chia sẻ.
            </StatusStrip>
          )}
        </div>
      )}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[55] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4">
          {toasts.map(view)}
        </div>
      )}
      {popup && view(popup)}
    </>
  );
}
