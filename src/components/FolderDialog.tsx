import { useState } from 'react';
import Modal from './Modal';
import { IconCheck, Owl, PALETTE, TOPICS, TopicIcon } from '../icons';
import { useAuth } from '../lib/auth';
import { Avatar } from './Navbar';
import { FOLDER_COLORS, FOLDER_ICONS, type Folder, type Visibility } from '../lib/types';
import type { FolderInput } from '../lib/folders';
import { VISIBILITY_INFO } from './VisibilityBadge';

export default function FolderDialog({
  initial,
  onClose,
  onSave,
  ownerControls = false,
}: {
  initial?: Folder;
  onClose: () => void;
  onSave: (input: FolderInput) => Promise<void>;
  /** Khi sửa: cho đổi hiện / ẩn tên người chia sẻ (chỉ chủ thư mục). */
  ownerControls?: boolean;
}) {
  const [form, setForm] = useState<FolderInput>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    color: initial?.color ?? 'lilac',
    icon: initial?.icon ?? 'book',
    visibility: initial?.visibility ?? 'private',
    showOwner: initial?.showOwner !== false,
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof FolderInput>(k: K, v: FolderInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal title={initial ? 'Sửa thư mục' : 'Thư mục mới'} onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.name.trim()) return;
          setBusy(true);
          try {
            await onSave({ ...form, name: form.name.trim(), description: form.description.trim() });
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex items-center justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl transition"
            style={{ background: PALETTE[form.color].light }}
          >
            <TopicIcon name={form.icon} color={form.color} size={50} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="fname">Tên thư mục</label>
          <input
            id="fname"
            className="input"
            autoFocus
            maxLength={100}
            placeholder="VD: Dược lý – Chương 1"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="fdesc">Mô tả (không bắt buộc)</label>
          <textarea
            id="fdesc"
            className="input min-h-[70px] resize-y"
            maxLength={1000}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <div>
          <span className="label">Màu sắc</span>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                aria-label={c}
                onClick={() => set('color', c)}
                className={`h-9 w-9 rounded-full border-4 transition ${form.color === c ? 'scale-110 border-ink/60' : 'border-surface'}`}
                style={{ background: PALETTE[c].main }}
              />
            ))}
          </div>
        </div>
        <div>
          <span className="label">
            Biểu tượng <span className="font-semibold text-ink/45">– {TOPICS[form.icon]?.label}</span>
          </span>
          <div className="grid max-h-48 grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5 overflow-y-auto rounded-2xl bg-ink/[0.03] p-2">
            {FOLDER_ICONS.map((i) => (
              <button
                type="button"
                key={i}
                title={TOPICS[i].label}
                aria-label={TOPICS[i].label}
                aria-pressed={form.icon === i}
                onClick={() => set('icon', i)}
                className={`flex aspect-square items-center justify-center rounded-xl border-2 transition hover:scale-110 ${
                  form.icon === i ? 'border-lilac-500 bg-lilac-100' : 'border-transparent bg-surface hover:border-lilac-300'
                }`}
              >
                <TopicIcon name={i} color={form.color} size={28} />
              </button>
            ))}
          </div>
        </div>
        {initial?.hidden ? (
          <p className="rounded-2xl bg-peach-100 px-4 py-3 text-sm font-bold text-ink/70">
            Thư mục đang bị kiểm duyệt ẩn nên chỉ để Riêng tư được.
          </p>
        ) : (
          <VisibilityPicker value={form.visibility} onChange={(v) => set('visibility', v)} />
        )}
        {(!initial || ownerControls) && form.visibility !== 'private' && (
          <OwnerToggle value={form.showOwner} onChange={(v) => set('showOwner', v)} />
        )}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button className="btn-primary" disabled={busy || !form.name.trim()}>
            {initial ? 'Lưu' : 'Tạo thư mục'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function VisibilityPicker({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <div>
      <span className="label">Ai được xem?</span>
      <div className="flex flex-col gap-2">
        {(Object.keys(VISIBILITY_INFO) as Visibility[]).map((v) => {
          const info = VISIBILITY_INFO[v];
          const active = value === v;
          return (
            <button
              type="button"
              key={v}
              onClick={() => onChange(v)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                active ? 'border-lilac-500 bg-lilac-100/60' : 'border-ink/10 bg-surface hover:border-lilac-300'
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${info.cls}`}>
                <info.Icon size={20} />
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold">{info.label}</span>
                <span className="block text-sm text-ink/55">{info.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Công tắc hiện / ẩn tên & ảnh người chia sẻ, kèm xem trước người khác sẽ thấy gì. */
export function OwnerToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { user } = useAuth();
  return (
    <div>
      <span className="label">Thông tin người chia sẻ</span>
      <div className="grid grid-cols-2 gap-2">
        {[true, false].map((show) => {
          const active = value === show;
          return (
            <button
              type="button"
              key={String(show)}
              onClick={() => onChange(show)}
              aria-pressed={active}
              className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
                active ? 'border-lilac-500 bg-lilac-100/60' : 'border-ink/10 bg-surface hover:border-lilac-300'
              }`}
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-lilac-500 text-white">
                  <IconCheck size={13} strokeWidth={3} />
                </span>
              )}
              {show ? (
                <Avatar url={user?.photoURL ?? null} name={user?.displayName ?? null} size={36} />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lilac-100">
                  <Owl size={30} />
                </span>
              )}
              <span className="text-sm font-extrabold">{show ? 'Hiện tên của tôi' : 'Ẩn danh'}</span>
              <span className="truncate text-xs font-semibold text-ink/50">
                {show ? (user?.displayName ?? '') : 'Người chia sẻ ẩn danh'}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-ink/50">
        Chọn “Ẩn danh” thì người xem sẽ không thấy tên và ảnh đại diện Google của bạn.
      </p>
    </div>
  );
}
