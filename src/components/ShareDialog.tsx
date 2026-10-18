import { useState } from 'react';
import Modal from './Modal';
import { OwnerToggle, VisibilityPicker } from './FolderDialog';
import { useAuth } from '../lib/auth';
import { siteUrl } from '../lib/basePath';
import { useToast } from './Toast';
import { IconCopy, IconEdit, IconEye, IconTrash, IconUsers } from '../icons';
import { saveSharing, setShowOwner, updateFolder, useSharing, type Sharing } from '../lib/folders';
import type { Folder } from '../lib/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ShareDialog({ folder, onClose }: { folder: Folder; onClose: () => void }) {
  const toast = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const url = siteUrl(`f/${folder.id}`);

  const save = async (patch: Parameters<typeof updateFolder>[1], msg: string) => {
    try {
      await updateFolder(folder.id, patch);
      toast(msg);
    } catch (e) {
      console.error(e);
      toast('Không lưu được, thử lại nhé!', 'error');
    }
  };

  // Danh sách email thật chỉ chủ thư mục / admin đọc được; thư mục chỉ lưu mã băm.
  const sharing = useSharing(folder.id);
  const share = async (next: Sharing, msg: string) => {
    try {
      await saveSharing(folder.id, next);
      toast(msg);
    } catch (e) {
      console.error(e);
      toast('Không lưu được, thử lại nhé!', 'error');
    }
  };

  const invite = async () => {
    const e = email.trim().toLowerCase();
    if (!EMAIL_RE.test(e)) return toast('Email chưa đúng định dạng', 'error');
    const viewers = sharing.viewerEmails.filter((x) => x !== e);
    const editors = sharing.editorEmails.filter((x) => x !== e);
    (role === 'editor' ? editors : viewers).push(e);
    await share({ viewerEmails: viewers, editorEmails: editors }, `Đã mời ${e}`);
    setEmail('');
  };

  const people = [
    ...sharing.editorEmails.map((e) => ({ email: e, role: 'editor' as const })),
    ...sharing.viewerEmails.map((e) => ({ email: e, role: 'viewer' as const })),
  ];

  return (
    <Modal title="Chia sẻ thư mục" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {folder.hidden ? (
          <p className="rounded-2xl bg-peach-100 px-4 py-3 text-sm font-bold text-ink/70">
            Thư mục đang bị kiểm duyệt ẩn nên chỉ để Riêng tư được. Bạn vẫn mời bạn bè qua email bên dưới.
          </p>
        ) : (
          <VisibilityPicker
            value={folder.visibility}
            onChange={(v) => v !== folder.visibility && save({ visibility: v }, 'Đã cập nhật quyền xem')}
          />
        )}

        {folder.visibility !== 'private' && user && (
          <OwnerToggle
            value={folder.showOwner !== false}
            onChange={(v) => {
              if (v === (folder.showOwner !== false)) return;
              setShowOwner(folder.id, user, v).then(
                () => toast(v ? 'Đã hiện tên của bạn' : 'Đã chuyển sang ẩn danh'),
                () => toast('Không lưu được, thử lại nhé!', 'error'),
              );
            }}
          />
        )}

        {folder.visibility !== 'private' && (
          <div>
            <span className="label">Link chia sẻ</span>
            <div className="flex gap-2">
              <input className="input text-sm" readOnly value={url} onFocus={(e) => e.target.select()} />
              <button
                className="btn-mint shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(url).then(
                    () => toast('Đã sao chép link'),
                    () => toast('Không sao chép được', 'error'),
                  );
                }}
              >
                <IconCopy size={18} /> Copy
              </button>
            </div>
          </div>
        )}

        <div>
          <span className="label flex items-center gap-1.5">
            <IconUsers size={16} /> Mời bạn bè qua email Google
          </span>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              invite();
            }}
          >
            <input
              className="input"
              type="email"
              placeholder="ban@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="input w-auto pr-8 font-bold"
                value={role}
                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor')}
              >
                <option value="viewer">Xem</option>
                <option value="editor">Sửa</option>
              </select>
              <button className="btn-primary shrink-0" disabled={!email.trim()}>
                Mời
              </button>
            </div>
          </form>
          <p className="mt-1.5 text-xs text-ink/50">
            Người được mời đăng nhập bằng đúng email này sẽ thấy thư mục trong mục “Được chia sẻ với tôi”, kể cả khi
            thư mục đang riêng tư. Quyền “Sửa” cho phép thêm / sửa / xóa câu hỏi.
          </p>
          {people.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1.5">
              {people.map((p) => (
                <li key={p.email} className="flex items-center gap-2 rounded-2xl bg-ink/[0.03] px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{p.email}</span>
                  <span className={`chip ${p.role === 'editor' ? 'bg-peach-100 text-peach-500' : 'bg-sky-100 text-sky-500'}`}>
                    {p.role === 'editor' ? <IconEdit size={12} /> : <IconEye size={12} />}
                    {p.role === 'editor' ? 'Sửa' : 'Xem'}
                  </span>
                  <button
                    className="btn-ghost p-1.5 text-rose-500"
                    aria-label={`Xóa ${p.email}`}
                    onClick={() =>
                      share(
                        {
                          viewerEmails: sharing.viewerEmails.filter((x) => x !== p.email),
                          editorEmails: sharing.editorEmails.filter((x) => x !== p.email),
                        },
                        'Đã bỏ chia sẻ',
                      )
                    }
                  >
                    <IconTrash size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
