import { useCallback, useState } from 'react';
import { useDismiss } from '../lib/useDismiss';
import { useAuth } from '../lib/auth';
import { usePush } from '../lib/push';
import { IconBell, IconCheck } from '../icons';
import { useToast } from './Toast';

/** Nút chuông trên thanh menu: bật / tắt thông báo đẩy (hiện cả khi đã đóng tab) trên thiết bị này. */
export default function PushButton() {
  const { uid, isGuest } = useAuth();
  const { state, enable, disable } = usePush(uid, isGuest);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss<HTMLDivElement>(open, close);
  const [busy, setBusy] = useState(false);

  if (state === 'unconfigured' || state === 'unsupported' || state === 'loading' || !uid) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        className={`btn relative px-2.5 py-2 ${state === 'on' ? 'text-lilac-500' : 'text-ink/60 hover:bg-ink/5 hover:text-ink'}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Thông báo đẩy"
        title="Thông báo đẩy"
      >
        <IconBell size={20} />
        {state === 'off' && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-cream bg-peach-500" />}
      </button>
      {open && (
        <>
          <div className="animate-pop card absolute right-0 mt-2 w-72 p-4">
            <h3 className="font-black">Thông báo đẩy</h3>
            <p className="mt-1 text-sm text-ink/60">
              {state === 'on'
                ? 'Đã bật trên thiết bị này. Bạn sẽ nhận thông báo mới như ứng dụng, kể cả khi đã đóng tab.'
                : state === 'denied'
                  ? 'Trình duyệt đang chặn thông báo của trang này. Hãy cho phép trong phần cài đặt trang web (biểu tượng ổ khóa cạnh địa chỉ).'
                  : 'Nhận thông báo mới như ứng dụng, kể cả khi đã đóng tab.'}
            </p>
            {state === 'on' ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="chip bg-mint-100 text-mint-500">
                  <IconCheck size={13} /> Đang bật
                </span>
                <button
                  className="btn-soft px-3 py-1.5 text-sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await disable().catch(console.error);
                    setBusy(false);
                    toast('Đã tắt thông báo đẩy');
                  }}
                >
                  Tắt
                </button>
              </div>
            ) : state === 'off' ? (
              <button
                className="btn-primary mt-3 w-full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await enable();
                    toast('Đã bật thông báo đẩy');
                    setOpen(false);
                  } catch (e) {
                    console.error(e);
                    toast('Chưa bật được thông báo', 'error');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <IconBell size={18} /> Bật thông báo
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
