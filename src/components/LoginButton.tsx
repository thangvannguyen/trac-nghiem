import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { GoogleLogo, Owl } from '../icons';
import { useToast } from './Toast';

export default function LoginButton({ compact }: { compact?: boolean }) {
  const { signIn } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className={compact ? 'btn-soft px-3 py-2' : 'btn-soft'}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signIn();
        } catch (e) {
          const code = (e as { code?: string }).code;
          if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request')
            toast('Đăng nhập không thành công, thử lại nhé!', 'error');
        } finally {
          setBusy(false);
        }
      }}
    >
      <GoogleLogo /> {compact ? <span className="hidden sm:inline">Đăng nhập</span> : 'Đăng nhập với Google'}
    </button>
  );
}

/** Màn hình nhắc đăng nhập cho các trang cần tài khoản. */
export function LoginPrompt({ message }: { message: string }) {
  return (
    <div className="card mx-auto mt-6 flex max-w-md flex-col items-center gap-4 p-8 text-center">
      <Owl size={110} mood="wow" className="animate-bob" />
      <h1 className="text-2xl font-black">Đăng nhập để tiếp tục</h1>
      <p className="text-ink/60">{message}</p>
      <LoginButton />
    </div>
  );
}
