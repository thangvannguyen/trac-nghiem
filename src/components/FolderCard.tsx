import { Link } from 'react-router-dom';
import { PALETTE, TopicIcon } from '../icons';
import type { Folder } from '../lib/types';
import VisibilityBadge from './VisibilityBadge';
import { OwnerChip } from './Navbar';
import { ownerInfo } from '../lib/folders';
import TimeAgo from './TimeAgo';
import { IconRefresh } from '../icons';

export default function FolderCard({ folder, showOwner }: { folder: Folder; showOwner?: boolean }) {
  const c = PALETTE[folder.color] ?? PALETTE.lilac;
  return (
    <Link
      to={`/f/${folder.id}`}
      className="card group flex flex-col gap-3 p-4 transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition group-hover:rotate-[-6deg]"
          style={{ background: c.light }}
        >
          <TopicIcon name={folder.icon} color={folder.color} size={34} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-black leading-snug">{folder.name}</h3>
          <div className="mt-1 text-sm font-bold" style={{ color: c.dark }}>
            {folder.questionCount} câu hỏi
          </div>
          {folder.updatedAt && (
            <div className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-ink/45">
              <IconRefresh size={12} strokeWidth={2.6} />
              <TimeAgo at={folder.updatedAt} prefix="Cập nhật " />
            </div>
          )}
        </div>
      </div>
      {folder.description && <p className="line-clamp-2 text-sm text-ink/60">{folder.description}</p>}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {showOwner ? (
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-ink/50">
            <OwnerChip owner={ownerInfo(folder)} />
          </span>
        ) : (
          <span />
        )}
        {folder.hidden ? (
          <span className="chip bg-peach-500 text-white" title={folder.hiddenReason}>
            Bị ẩn
          </span>
        ) : (
          <VisibilityBadge visibility={folder.visibility} />
        )}
      </div>
    </Link>
  );
}

export function FolderGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-36 animate-pulse bg-surface/60" />
      ))}
    </div>
  );
}
