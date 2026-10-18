import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site';
import { useMyQuota } from '../lib/quota';
import QuotaCard from '../components/QuotaCard';
import { createFolder, useMyFolders, useSharedFolders } from '../lib/folders';
import FolderCard, { FolderGridSkeleton } from '../components/FolderCard';
import FolderDialog from '../components/FolderDialog';
import EmptyState from '../components/EmptyState';
import { LoginPrompt } from '../components/LoginButton';
import { useToast } from '../components/Toast';
import { IconPlus, IconUsers } from '../icons';

export default function MyFolders() {
  const { user, emailKey, loading: authLoading } = useAuth();
  const mine = useMyFolders(user?.uid);
  const shared = useSharedFolders(emailKey);
  const [creating, setCreating] = useState(false);
  const { canWrite, role } = useSite();
  const quota = useMyQuota(user?.uid);
  const folderFull = !role.isAdmin && quota.maxFolders !== 0 && quota.folders >= quota.maxFolders;
  const canCreate = canWrite && !folderFull;
  const navigate = useNavigate();
  const toast = useToast();

  if (authLoading) return <FolderGridSkeleton />;
  if (!user) return <LoginPrompt message="Đăng nhập để tạo thư mục, thêm câu hỏi và lưu tiến độ học của bạn." />;

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Thư mục của tôi</h1>
            <p className="text-ink/55">Xin chào {user.displayName?.split(' ').pop()}! Hôm nay học gì nào?</p>
          </div>
          <button className="btn-primary shrink-0" disabled={!canCreate} title={folderFull ? 'Đã hết hạn mức thư mục' : undefined} onClick={() => setCreating(true)}>
            <IconPlus size={20} /> <span className="hidden sm:inline">Thư mục mới</span>
          </button>
        </div>
        <div className="mb-4">
          <QuotaCard quota={quota} isAdmin={role.isAdmin} />
        </div>
        {mine.loading ? (
          <FolderGridSkeleton />
        ) : mine.error ? (
          <EmptyState title="Chưa tải được dữ liệu">
            <p className="text-sm text-ink/55">{mine.error}</p>
          </EmptyState>
        ) : mine.data.length === 0 ? (
          <EmptyState title="Bạn chưa có thư mục nào">
            <button className="btn-primary" disabled={!canCreate} title={folderFull ? 'Đã hết hạn mức thư mục' : undefined} onClick={() => setCreating(true)}>
              <IconPlus size={20} /> Tạo thư mục đầu tiên
            </button>
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.data.map((f) => (
              <FolderCard key={f.id} folder={f} />
            ))}
          </div>
        )}
      </section>

      {(shared.loading || shared.data.length > 0) && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
            <IconUsers className="text-sky-500" /> Được chia sẻ với tôi
          </h2>
          {shared.loading ? (
            <FolderGridSkeleton />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shared.data.map((f) => (
                <FolderCard key={f.id} folder={f} showOwner />
              ))}
            </div>
          )}
        </section>
      )}

      {creating && (
        <FolderDialog
          onClose={() => setCreating(false)}
          onSave={async (input) => {
            try {
              const id = await createFolder(user, input);
              toast('Đã tạo thư mục');
              navigate(`/f/${id}`);
            } catch (e) {
              console.error(e);
              toast('Không tạo được thư mục', 'error');
            }
          }}
        />
      )}
    </div>
  );
}
