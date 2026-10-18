import type { Quota } from '../lib/quota';
import { fmtMax } from '../lib/quota';
import { IconFolder, IconList } from '../icons';

function Meter({ label, used, max, Icon }: { label: string; used: number; max: number; Icon: typeof IconFolder }) {
  const unlimited = max === 0;
  const pct = unlimited ? 0 : Math.min(100, (used / max) * 100);
  const full = !unlimited && used >= max;
  const near = !unlimited && !full && pct >= 80;
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-1.5 font-extrabold text-ink/70">
          <Icon size={16} className="text-lilac-500" /> {label}
        </span>
        <span className={`font-black tabular-nums ${full ? 'text-peach-500' : ''}`}>
          {used}
          <span className="font-bold text-ink/40"> / {fmtMax(max)}</span>
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-lilac-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${full ? 'bg-peach-500' : near ? 'bg-lemon-500' : 'bg-lilac-500'}`}
          style={{ width: unlimited ? '100%' : `${pct}%`, opacity: unlimited ? 0.3 : 1 }}
        />
      </div>
    </div>
  );
}

/** Thẻ "đã dùng / hạn mức" ở trang Thư mục của tôi. */
export default function QuotaCard({ quota, isAdmin }: { quota: Quota; isAdmin: boolean }) {
  if (quota.loading) return <div className="card h-[76px] animate-pulse bg-surface/60" />;
  if (isAdmin)
    return (
      <div className="card px-4 py-3 text-sm font-bold text-lilac-500">Bạn là admin – không giới hạn số thư mục và câu hỏi.</div>
    );
  const fullF = quota.maxFolders !== 0 && quota.folders >= quota.maxFolders;
  const fullQ = quota.maxQuestions !== 0 && quota.questions >= quota.maxQuestions;
  return (
    <div className="card flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <Meter label="Thư mục" used={quota.folders} max={quota.maxFolders} Icon={IconFolder} />
        <Meter label="Câu hỏi" used={quota.questions} max={quota.maxQuestions} Icon={IconList} />
      </div>
      {(fullF || fullQ) && (
        <p className="text-xs font-bold text-peach-500">
          Bạn đã dùng hết hạn mức {fullF && fullQ ? 'thư mục và câu hỏi' : fullF ? 'thư mục' : 'câu hỏi'}. Liên hệ admin nếu cần thêm.
        </p>
      )}
    </div>
  );
}
