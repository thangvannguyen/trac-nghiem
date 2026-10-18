import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { useAllFolders } from '../lib/admin';
import { hideQuestion, removeQuestion, unhideQuestion, useAllQuestions, type ModQuestion } from '../lib/moderation';
import TimeAgo from '../components/TimeAgo';
import { useToast } from '../components/Toast';
import { IconBan, IconBulb, IconCheck, IconEye, IconSearch, IconTrash, PALETTE, TopicIcon } from '../icons';

/* Kiểm duyệt câu hỏi trên toàn hệ thống (kiểm duyệt viên + admin). */

type Filter = 'all' | 'visible' | 'hidden';
const PAGE = 200;
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

export default function QuestionsTab({ me }: { me: User }) {
  const toast = useToast();
  const [max, setMax] = useState(PAGE);
  const questions = useAllQuestions(true, max);
  const folders = useAllFolders(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [folderId, setFolderId] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const folderMap = useMemo(() => new Map(folders.data.map((f) => [f.id, f])), [folders.data]);
  const key = (x: ModQuestion) => `${x.folderId}/${x.id}`;

  const rows = questions.data.filter((x) => {
    if (filter === 'visible' && x.hidden) return false;
    if (filter === 'hidden' && !x.hidden) return false;
    if (folderId && x.folderId !== folderId) return false;
    if (!q.trim()) return true;
    const f = folderMap.get(x.folderId);
    return norm(`${x.text} ${x.options.map((o) => o.text).join(' ')} ${x.note} ${f?.name ?? ''}`).includes(norm(q));
  });
  const counts = {
    all: questions.data.length,
    visible: questions.data.filter((x) => !x.hidden).length,
    hidden: questions.data.filter((x) => x.hidden).length,
  };
  const picked = rows.filter((x) => selected.has(key(x)));
  const allPicked = rows.length > 0 && picked.length === rows.length;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      setSelected(new Set());
    } catch (e) {
      console.error(e);
      toast('Không thực hiện được', 'error');
    } finally {
      setBusy(false);
    }
  };

  const askHide = (list: ModQuestion[]) => {
    const reason = prompt(`Ẩn ${list.length} câu hỏi khỏi người học?\nLý do (chủ thư mục sẽ thấy):`, 'Nội dung không phù hợp');
    if (reason !== null) run(() => Promise.all(list.map((x) => hideQuestion(me, x, reason.trim()))), `Đã ẩn ${list.length} câu`);
  };
  const askDelete = (list: ModQuestion[]) =>
    confirm(`XÓA vĩnh viễn ${list.length} câu hỏi? Không thể hoàn tác.`) &&
    run(async () => {
      for (const x of list) await removeQuestion(me, x, folderMap.get(x.folderId));
    }, `Đã xóa ${list.length} câu`);

  return (
    <div className="flex flex-col gap-3">
      {/* ---------- Bộ lọc ---------- */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', 'Tất cả'],
              ['visible', 'Đang hiện'],
              ['hidden', 'Đã ẩn'],
            ] as [Filter, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`chip px-3 py-1.5 text-sm ${filter === k ? 'bg-ink text-cream' : 'bg-surface text-ink/60 hover:text-ink'}`}
            >
              {label} <span className="opacity-60">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select className="input py-2 text-sm font-bold sm:w-56" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
            <option value="">Mọi thư mục</option>
            {folders.data.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <label className="relative sm:w-64">
            <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input className="input py-2 pl-10" placeholder="Tìm nội dung, đáp án, ghi chú…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
      </div>

      {/* ---------- Thao tác hàng loạt ---------- */}
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-2xl bg-surface/95 px-3 py-2 shadow-soft backdrop-blur">
        <label className="flex items-center gap-2 text-sm font-bold text-ink/70">
          <input
            type="checkbox"
            className="h-4 w-4 accent-lilac-500"
            checked={allPicked}
            onChange={() => setSelected(allPicked ? new Set() : new Set(rows.map(key)))}
          />
          {picked.length ? `Đã chọn ${picked.length}` : `Chọn tất cả (${rows.length})`}
        </label>
        {picked.length > 0 && (
          <div className="ml-auto flex flex-wrap gap-1.5">
            <button className="btn-soft px-3 py-1.5 text-sm" disabled={busy} onClick={() => askHide(picked.filter((x) => !x.hidden))}>
              <IconBan size={16} /> Ẩn
            </button>
            <button
              className="btn-soft px-3 py-1.5 text-sm"
              disabled={busy}
              onClick={() => run(() => Promise.all(picked.filter((x) => x.hidden).map((x) => unhideQuestion(me, x))), 'Đã bỏ ẩn')}
            >
              <IconEye size={16} /> Bỏ ẩn
            </button>
            <button className="btn-danger px-3 py-1.5 text-sm" disabled={busy} onClick={() => askDelete(picked)}>
              <IconTrash size={16} /> Xóa
            </button>
          </div>
        )}
      </div>

      {/* ---------- Danh sách ---------- */}
      {questions.loading ? (
        <div className="card h-48 animate-pulse" />
      ) : questions.error ? (
        <p className="card p-4 text-sm font-bold text-rose-500">{questions.error}</p>
      ) : rows.length === 0 ? (
        <p className="card p-8 text-center text-sm font-bold text-ink/50">Không có câu hỏi nào phù hợp.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((x) => {
            const f = folderMap.get(x.folderId);
            const k = key(x);
            return (
              <li key={k} className={`card flex gap-3 p-4 ${x.hidden ? 'border-2 border-dashed border-peach-300 bg-peach-100/30' : ''}`}>
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 accent-lilac-500"
                  checked={selected.has(k)}
                  onChange={() =>
                    setSelected((s) => {
                      const n = new Set(s);
                      if (n.has(k)) n.delete(k);
                      else n.add(k);
                      return n;
                    })
                  }
                  aria-label="Chọn câu hỏi"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-bold text-ink/50">
                    {f ? (
                      <Link to={`/f/${f.id}`} className="flex items-center gap-1.5 rounded-lg bg-ink/[0.04] py-0.5 pl-0.5 pr-2 hover:text-lilac-500">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md" style={{ background: PALETTE[f.color]?.light }}>
                          <TopicIcon name={f.icon} color={f.color} size={14} />
                        </span>
                        {f.name}
                      </Link>
                    ) : (
                      <span>Thư mục {x.folderId.slice(0, 6)}…</span>
                    )}
                    {f && <span>· {f.ownerName || 'Ẩn danh'}</span>}
                    <span>
                      · <TimeAgo at={x.createdAt} />
                    </span>
                    {x.hidden && (
                      <span className="chip bg-peach-500 text-white" title={x.hiddenReason}>
                        Đã ẩn{x.hiddenReason ? `: ${x.hiddenReason}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-line font-bold leading-snug">{x.text}</p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {x.options.map((o, i) => {
                      const right = x.correctIds.includes(o.id);
                      return (
                        <li key={o.id} className={`flex items-start gap-1.5 rounded-lg px-2 py-1 ${right ? 'bg-mint-100 font-bold' : 'bg-ink/[0.03]'}`}>
                          <span className="font-black">{String.fromCharCode(65 + i)}.</span>
                          <span className="flex-1">{o.text}</span>
                          {right && <IconCheck size={15} className="mt-0.5 shrink-0 text-mint-500" />}
                        </li>
                      );
                    })}
                  </ul>
                  {x.note && (
                    <p className="mt-2 flex gap-1.5 text-sm text-ink/60">
                      <IconBulb size={16} className="mt-0.5 shrink-0 text-lemon-500" />
                      <span className="line-clamp-2 whitespace-pre-line">{x.note}</span>
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  {x.hidden ? (
                    <button className="btn-soft px-3 py-1.5 text-sm" disabled={busy} onClick={() => run(() => unhideQuestion(me, x), 'Đã bỏ ẩn')}>
                      <IconEye size={16} /> Bỏ ẩn
                    </button>
                  ) : (
                    <button className="btn-soft px-3 py-1.5 text-sm" disabled={busy} onClick={() => askHide([x])}>
                      <IconBan size={16} /> Ẩn
                    </button>
                  )}
                  <button className="btn-danger px-3 py-1.5 text-sm" disabled={busy} onClick={() => askDelete([x])}>
                    <IconTrash size={16} /> Xóa
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {questions.data.length >= max && (
        <button className="btn-soft self-center" onClick={() => setMax((m) => m + PAGE)}>
          Tải thêm {PAGE} câu cũ hơn
        </button>
      )}
      <p className="text-xs font-semibold text-ink/45">
        Câu bị ẩn sẽ không hiện cho người học, khi làm bài và khi in A4. Chủ thư mục / người được cấp quyền sửa vẫn thấy câu kèm lý do để
        chỉnh lại. Tìm kiếm áp dụng trên {questions.data.length} câu đã tải (mới nhất trước).
      </p>
    </div>
  );
}
