import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site';
import { logFolderDelete } from '../lib/admin';
import { deleteFolder, ownerInfo, setShowOwner, updateFolder } from '../lib/folders';
import { addQuestions, deleteQuestion, swapOrder, useQuestions } from '../lib/questions';
import { reviewQueue, useProgress } from '../lib/progress';
import type { Folder, Question, Role } from '../lib/types';
import FolderGate from '../components/FolderGate';
import QuestionPaper from '../components/QuestionPaper';
import { remaining, useMyQuota } from '../lib/quota';
import TimeAgo from '../components/TimeAgo';
import { fullDateTime } from '../lib/time';
import FolderDialog from '../components/FolderDialog';
import ShareDialog from '../components/ShareDialog';
import BulkImportDialog from '../components/BulkImportDialog';
import EmptyState from '../components/EmptyState';
import VisibilityBadge from '../components/VisibilityBadge';
import { OwnerChip } from '../components/Navbar';
import { useToast } from '../components/Toast';
import {
  IconArrowLeft,
  IconBan,
  IconBulb,
  IconCheck,
  IconDown,
  IconEdit,
  IconEye,
  IconImport,
  IconPlay,
  IconPlus,
  IconList,
  IconPage,
  IconPrinter,
  IconRefresh,
  IconRepeat,
  IconShare,
  IconShuffle,
  IconTrash,
  IconUp,
  PALETTE,
  TopicIcon,
} from '../icons';

export default function FolderDetail() {
  const { folderId } = useParams();
  return <FolderGate folderId={folderId}>{(folder, role) => <Detail folder={folder} role={role} />}</FolderGate>;
}

function Detail({ folder, role }: { folder: Folder; role: Role }) {
  const { user, uid } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: allQuestions, loading } = useQuestions(folder.id, true);
  const { stats } = useProgress(folder.id, uid);
  const [dialog, setDialog] = useState<'edit' | 'share' | 'import' | null>(null);
  const [showAnswers, setShowAnswers] = useState(true);
  // Chế độ xem ghi trên URL (?view=a4) để gửi link là mở đúng kiểu xem.
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'a4' ? 'a4' : 'cards';
  const setView = (v: 'a4' | 'cards') =>
    setParams(
      (p) => {
        if (v === 'a4') p.set('view', 'a4');
        else p.delete('view');
        return p;
      },
      { replace: true },
    );

  const site = useSite();
  // Admin sửa được mọi thư mục; chủ / người được mời sửa thì cần không bị khóa và web không bảo trì.
  const canEdit = site.role.isAdmin || ((role === 'owner' || role === 'editor') && site.canWrite);
  const isOwner = role === 'owner' && site.canWrite;
  // Câu bị kiểm duyệt ẩn: chỉ chủ / người sửa / kiểm duyệt viên thấy (kèm lý do); người học thì không.
  const seesHidden = canEdit || role === 'owner' || role === 'editor' || site.role.isModerator;
  const questions = seesHidden ? allQuestions : allQuestions.filter((q) => !q.hidden);
  const learnable = allQuestions.filter((q) => !q.hidden);
  // Hạn mức câu hỏi: chủ thư mục (không phải admin) chỉ được thêm trong phạm vi còn lại.
  const quota = useMyQuota(role === 'owner' ? user?.uid : undefined);
  const qLeft = role === 'owner' && !site.role.isAdmin && !quota.loading ? remaining(quota.maxQuestions, quota.questions) : Infinity;
  const c = PALETTE[folder.color] ?? PALETTE.lilac;
  const reviewCount = reviewQueue(learnable, stats).length;
  const nextOrder = questions.length ? questions[questions.length - 1].order + 1 : 0;

  return (
    <div className="flex flex-col gap-6">
      <Link to={user ? '/me' : '/'} className="btn-ghost -ml-2 self-start">
        <IconArrowLeft size={20} /> Quay lại
      </Link>

      {folder.hidden && (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-peach-300 bg-peach-100/60 px-4 py-3 text-sm">
          <IconBan size={20} className="mt-0.5 shrink-0 text-peach-500" />
          <div>
            <b>Thư mục đã bị kiểm duyệt ẩn</b>
            {folder.hiddenReason && <> – lý do: {folder.hiddenReason}</>}
            <p className="text-ink/60">Thư mục được chuyển về Riêng tư và không thể công khai cho tới khi kiểm duyệt viên bỏ ẩn.</p>
          </div>
        </div>
      )}
      <section className="card overflow-hidden">
        <div className="h-3" style={{ background: c.main }} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl" style={{ background: c.light }}>
            <TopicIcon name={folder.icon} color={folder.color} size={50} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black sm:text-3xl">{folder.name}</h1>
              <VisibilityBadge visibility={folder.visibility} />
              {role === 'editor' && <span className="chip bg-peach-100 text-peach-500">Bạn có quyền sửa</span>}
            </div>
            {folder.description && <p className="mt-1.5 whitespace-pre-line text-ink/60">{folder.description}</p>}
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-ink/50">
              <OwnerChip owner={ownerInfo(folder)} size={22} />
              {role === 'owner' && folder.showOwner === false && folder.visibility !== 'private' && (
                <span className="chip bg-lilac-100 text-lilac-500">bạn đang ẩn danh</span>
              )}
              <span className="shrink-0">· {questions.length} câu hỏi</span>
            </div>
            {(folder.updatedAt || folder.createdAt) && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-ink/50">
                {folder.updatedAt && (
                  <span className="flex items-center gap-1.5">
                    <IconRefresh size={13} strokeWidth={2.6} />
                    Cập nhật: <b className="text-ink/70">{fullDateTime(folder.updatedAt.toMillis())}</b>
                    <span className="text-ink/40">
                      (<TimeAgo at={folder.updatedAt} />)
                    </span>
                  </span>
                )}
                {folder.createdAt && (
                  <span className="flex items-center gap-1.5">
                    <IconPlus size={13} strokeWidth={2.6} />
                    Tạo lúc: <b className="text-ink/70">{fullDateTime(folder.createdAt.toMillis())}</b>
                  </span>
                )}
              </div>
            )}
          </div>
          {(isOwner || site.role.isAdmin) && (
            <div className="flex gap-1 sm:flex-col">
              <button className="btn-soft" onClick={() => setDialog('share')}>
                <IconShare size={18} /> Chia sẻ
              </button>
              <button className="btn-ghost" onClick={() => setDialog('edit')}>
                <IconEdit size={18} /> Sửa
              </button>
              <button
                className="btn-ghost text-rose-500"
                onClick={async () => {
                  if (!confirm(`Xóa thư mục “${folder.name}” và toàn bộ ${questions.length} câu hỏi? Không thể hoàn tác.`))
                    return;
                  try {
                    await deleteFolder(folder);
                    if (role !== 'owner' && user) await logFolderDelete(user, folder);
                    toast('Đã xóa thư mục');
                    navigate('/me');
                  } catch (e) {
                    console.error(e);
                    toast('Không xóa được', 'error');
                  }
                }}
              >
                <IconTrash size={18} /> Xóa
              </button>
            </div>
          )}
        </div>
      </section>

      {learnable.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-3">
          <StudyButton to={`/f/${folder.id}/study?mode=learn`} cls="btn-primary" Icon={IconPlay} title="Học" sub="Biết đúng sai ngay" />
          <StudyButton to={`/f/${folder.id}/study?mode=test`} cls="btn-test" Icon={IconShuffle} title="Kiểm tra" sub="Trộn câu, chấm điểm" />
          <StudyButton
            to={`/f/${folder.id}/study?mode=review`}
            cls="btn-review"
            Icon={IconRepeat}
            title={`Ôn câu sai (${reviewCount})`}
            sub={reviewCount ? 'Luyện lại câu hay sai' : 'Chưa có câu sai nào'}
            disabled={!reviewCount}
          />
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-black">Danh sách câu hỏi</h2>
          <div className="flex flex-wrap items-center gap-2">
            {questions.length > 0 && (
              <div className="flex rounded-2xl bg-surface p-1 shadow-soft" role="group" aria-label="Kiểu xem">
                {(
                  [
                    ['cards', 'Thẻ', IconList],
                    ['a4', 'Trang A4', IconPage],
                  ] as const
                ).map(([k, label, Icon]) => (
                  <button
                    key={k}
                    aria-pressed={view === k}
                    onClick={() => setView(k)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-extrabold transition ${
                      view === k ? 'bg-lilac-500 text-white' : 'text-ink/55 hover:text-ink'
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            )}
            {questions.length > 0 && (
              <button className="btn-ghost" onClick={() => setShowAnswers((s) => !s)}>
                <IconEye size={18} /> {showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án'}
              </button>
            )}
            {questions.length > 0 && view === 'a4' && (
              <button className="btn-soft" onClick={() => window.print()} title="In hoặc chọn “Lưu dưới dạng PDF”">
                <IconPrinter size={18} /> In / PDF
              </button>
            )}
            {canEdit && (
              <>
                {qLeft !== Infinity && (
                  <span className={`chip ${qLeft === 0 ? 'bg-peach-100 text-peach-500' : 'bg-ink/5 text-ink/55'}`}>
                    {qLeft === 0 ? 'Hết hạn mức câu hỏi' : `Còn thêm được ${qLeft} câu`}
                  </span>
                )}
                <button className="btn-soft" disabled={qLeft === 0} onClick={() => setDialog('import')}>
                  <IconImport size={18} /> Thêm nhanh
                </button>
                {qLeft === 0 ? (
                  <button className="btn-primary" disabled>
                    <IconPlus size={18} /> Thêm câu
                  </button>
                ) : (
                  <Link to={`/f/${folder.id}/new`} className="btn-primary">
                    <IconPlus size={18} /> Thêm câu
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="card h-32 animate-pulse bg-surface/60" />
        ) : questions.length === 0 ? (
          <EmptyState title="Thư mục còn trống">
            {canEdit ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Link to={`/f/${folder.id}/new`} className="btn-primary">
                  <IconPlus size={18} /> Thêm câu đầu tiên
                </Link>
                <button className="btn-soft" onClick={() => setDialog('import')}>
                  <IconImport size={18} /> Dán nhiều câu
                </button>
              </div>
            ) : (
              <p className="text-sm text-ink/55">Chủ thư mục chưa thêm câu hỏi nào.</p>
            )}
          </EmptyState>
        ) : view === 'a4' ? (
          <QuestionPaper folder={folder} questions={learnable} showAnswers={showAnswers} />
        ) : (
          <ol className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <QuestionItem
                key={q.id}
                index={i}
                question={q}
                folderId={folder.id}
                ownerId={folder.ownerId}
                canEdit={canEdit}
                showAnswers={showAnswers}
                prev={questions[i - 1]}
                next={questions[i + 1]}
              />
            ))}
          </ol>
        )}
      </section>

      {dialog === 'edit' && (
        <FolderDialog
          initial={folder}
          ownerControls={role === 'owner'}
          onClose={() => setDialog(null)}
          onSave={async ({ name, description, color, icon, visibility, showOwner }) => {
            try {
              await updateFolder(folder.id, { name, description, color, icon, ...(folder.hidden ? {} : { visibility }) });
              // Đổi hiện / ẩn tên: cập nhật cả tên & ảnh lưu trong thư mục (chỉ chủ thư mục).
              if (role === 'owner' && user && showOwner !== (folder.showOwner !== false)) await setShowOwner(folder.id, user, showOwner);
              toast('Đã lưu');
              setDialog(null);
            } catch (e) {
              console.error(e);
              toast('Không lưu được', 'error');
            }
          }}
        />
      )}
      {dialog === 'share' && <ShareDialog folder={folder} onClose={() => setDialog(null)} />}
      {dialog === 'import' && user && (
        <BulkImportDialog
          remaining={qLeft}
          onClose={() => setDialog(null)}
          onImport={async (qs) => {
            try {
              await addQuestions(folder.id, folder.ownerId, user.uid, qs, nextOrder);
              toast(`Đã thêm ${qs.length} câu`);
              setDialog(null);
            } catch (e) {
              console.error(e);
              toast(
                (e as { code?: string }).code === 'permission-denied' ? 'Không thêm được: đã vượt hạn mức câu hỏi của chủ thư mục' : 'Không thêm được câu hỏi',
                'error',
              );
            }
          }}
        />
      )}
    </div>
  );
}

function StudyButton({
  to,
  cls,
  Icon,
  title,
  sub,
  disabled,
}: {
  to: string;
  cls: string;
  Icon: typeof IconPlay;
  title: string;
  sub: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface/25">
        <Icon size={22} />
      </span>
      <span className="text-left">
        <span className="block text-lg leading-tight">{title}</span>
        <span className="block text-xs font-semibold opacity-85">{sub}</span>
      </span>
    </>
  );
  return disabled ? (
    <div className={`${cls} justify-start py-3 opacity-50`}>{inner}</div>
  ) : (
    <Link to={to} className={`${cls} justify-start py-3`}>
      {inner}
    </Link>
  );
}

function QuestionItem({
  index,
  question: q,
  folderId,
  ownerId,
  canEdit,
  showAnswers,
  prev,
  next,
}: {
  index: number;
  question: Question;
  folderId: string;
  ownerId: string;
  canEdit: boolean;
  showAnswers: boolean;
  prev?: Question;
  next?: Question;
}) {
  const toast = useToast();
  const multi = q.correctIds.length > 1;
  return (
    <li className={`card p-4 sm:p-5 ${q.hidden ? 'border-2 border-dashed border-peach-300 bg-peach-100/30' : ''}`}>
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lilac-100 text-sm font-black text-lilac-500">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line font-bold leading-relaxed">{q.text}</p>
          {multi && <span className="chip mt-1 bg-lemon-100 text-ink/60">Nhiều đáp án đúng</span>}
          {q.hidden && (
            <span className="chip ml-1 mt-1 bg-peach-500 text-white" title="Người học sẽ không thấy câu này">
              Bị kiểm duyệt ẩn{q.hiddenReason ? `: ${q.hiddenReason}` : ''}
            </span>
          )}
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {q.options.map((o, i) => {
              const right = showAnswers && q.correctIds.includes(o.id);
              return (
                <li
                  key={o.id}
                  className={`flex items-start gap-2 rounded-xl px-3 py-2 text-sm ${
                    right ? 'bg-mint-100 font-bold text-mint-500' : 'bg-ink/[0.03]'
                  }`}
                >
                  <span className="font-black">{String.fromCharCode(65 + i)}.</span>
                  <span className={`flex-1 ${right ? '' : 'text-ink'}`}>{o.text}</span>
                  {right && <IconCheck size={16} className="mt-0.5 shrink-0" />}
                </li>
              );
            })}
          </ul>
          {showAnswers && q.note && (
            <div className="mt-3 flex gap-2 rounded-xl bg-lemon-100 px-3 py-2 text-sm">
              <IconBulb size={18} className="shrink-0 text-lemon-500" />
              <p className="whitespace-pre-line">{q.note}</p>
            </div>
          )}
        </div>
        {canEdit && (
          <div className="-mr-2 -mt-1 flex shrink-0 flex-col">
            <Link to={`/f/${folderId}/edit/${q.id}`} className="btn-ghost p-2" aria-label="Sửa câu hỏi">
              <IconEdit size={18} />
            </Link>
            <button
              className="btn-ghost p-2"
              aria-label="Đưa lên"
              disabled={!prev}
              onClick={() => prev && swapOrder(folderId, q, prev)}
            >
              <IconUp size={18} />
            </button>
            <button
              className="btn-ghost p-2"
              aria-label="Đưa xuống"
              disabled={!next}
              onClick={() => next && swapOrder(folderId, q, next)}
            >
              <IconDown size={18} />
            </button>
            <button
              className="btn-ghost p-2 text-rose-500"
              aria-label="Xóa câu hỏi"
              onClick={async () => {
                if (!confirm('Xóa câu hỏi này?')) return;
                try {
                  await deleteQuestion(folderId, ownerId, q.id);
                  toast('Đã xóa câu hỏi');
                } catch (e) {
                  console.error(e);
                  toast('Không xóa được', 'error');
                }
              }}
            >
              <IconTrash size={18} />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
