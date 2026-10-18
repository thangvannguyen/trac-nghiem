import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { roleOf, useFolder } from '../lib/folders';
import type { Folder, Role } from '../lib/types';
import { LoginPrompt } from './LoginButton';
import NotFound from '../pages/NotFound';

/** Tải thư mục theo ID (realtime) và xử lý các trạng thái đang tải / không có quyền / không tồn tại. */
export default function FolderGate({
  folderId,
  children,
}: {
  folderId: string | undefined;
  children: (folder: Folder, role: Role) => ReactNode;
}) {
  const { user, loading, emailKey } = useAuth();
  const state = useFolder(loading ? undefined : folderId, user?.uid ?? 'guest');

  if (loading || state.status === 'loading')
    return (
      <div className="flex flex-col gap-4">
        <div className="card h-40 animate-pulse bg-surface/60" />
        <div className="card h-24 animate-pulse bg-surface/60" />
      </div>
    );
  if (state.status === 'denied')
    return user ? (
      <NotFound title="Thư mục riêng tư" message="Bạn chưa được chủ thư mục chia sẻ. Hãy nhờ họ mời email của bạn nhé!" />
    ) : (
      <LoginPrompt message="Thư mục này riêng tư. Nếu bạn được mời, hãy đăng nhập bằng email đã được chia sẻ." />
    );
  if (state.status === 'notfound') return <NotFound title="Không tìm thấy thư mục" />;
  return <>{children(state.folder, roleOf(state.folder, user, emailKey))}</>;
}
