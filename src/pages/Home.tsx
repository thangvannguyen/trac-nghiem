import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useFeaturedFolders, usePublicFolders } from '../lib/folders';
import FolderCard, { FolderGridSkeleton } from '../components/FolderCard';
import EmptyState from '../components/EmptyState';
import LoginButton from '../components/LoginButton';
import { IconFolder, IconSearch, IconShare, IconSparkle, Owl } from '../icons';

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');

export default function Home() {
  const { user } = useAuth();
  const { data, loading, error } = usePublicFolders();
  const featured = useFeaturedFolders();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const k = normalize(q.trim());
    if (!k) return data;
    return data.filter((f) => normalize(`${f.name} ${f.description} ${f.ownerName}`).includes(k));
  }, [data, q]);

  return (
    <div className="flex flex-col gap-10">
      <section className="card relative overflow-hidden p-6 sm:p-10">
        <div className="relative z-10 max-w-xl">
          <span className="chip mb-3 bg-lemon-100 text-ink/70">
            <IconSparkle size={14} /> Học trắc nghiệm thật vui
          </span>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">
            Tự tạo bộ câu hỏi, <span className="text-lilac-500">ôn bài</span> mỗi ngày & học cùng bạn bè
          </h1>
          <p className="mt-3 text-ink/60">
            Gom câu hỏi vào từng thư mục, thêm ghi chú giải thích, rồi học theo 3 chế độ: Học, Kiểm tra và Ôn câu sai.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {user ? (
              <Link to="/me" className="btn-primary">
                <IconFolder size={20} /> Thư mục của tôi
              </Link>
            ) : (
              <LoginButton />
            )}
            <a href="#explore" className="btn-soft">
              <IconSearch size={20} /> Khám phá
            </a>
          </div>
          <ul className="mt-6 grid gap-2 text-sm font-bold text-ink/70 sm:grid-cols-3">
            <li className="flex items-center gap-2"><IconFolder size={18} className="text-peach-500" /> Thư mục riêng</li>
            <li className="flex items-center gap-2"><IconShare size={18} className="text-sky-500" /> Chia sẻ dễ dàng</li>
            <li className="flex items-center gap-2"><IconSparkle size={18} className="text-mint-500" /> Đồng bộ tức thì</li>
          </ul>
        </div>
        <Owl size={220} className="animate-bob pointer-events-none absolute -bottom-6 -right-6 hidden opacity-95 sm:block" />
      </section>

      {featured.data.length > 0 && (
        <section>
          <h2 className="mb-1 flex items-center gap-2 text-2xl font-black">
            <IconSparkle className="text-lemon-500" /> Nổi bật
          </h2>
          <p className="mb-4 text-ink/55">Bộ câu hỏi được đội ngũ quản trị chọn lọc.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.data.map((f) => (
              <div key={f.id} className="rounded-blob ring-4 ring-lemon-300/60">
                <FolderCard folder={f} showOwner />
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="explore" className="scroll-mt-20">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">Khám phá</h2>
            <p className="text-ink/55">Các thư mục được chia sẻ công khai – không cần đăng nhập để học.</p>
          </div>
          <label className="relative sm:w-72">
            <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
            <input className="input pl-10" placeholder="Tìm thư mục…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        {loading ? (
          <FolderGridSkeleton />
        ) : error ? (
          <EmptyState title="Chưa tải được dữ liệu">
            <p className="text-sm text-ink/55">{error}</p>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState title={q ? 'Không tìm thấy thư mục nào' : 'Chưa có thư mục công khai nào'}>
            <p className="text-sm text-ink/55">Hãy là người đầu tiên chia sẻ bộ câu hỏi của bạn!</p>
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => (
              <FolderCard key={f.id} folder={f} showOwner />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
