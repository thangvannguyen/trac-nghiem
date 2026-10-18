import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site';
import { remaining, useMyQuota } from '../lib/quota';
import { addQuestions, newId, updateQuestion, useQuestions, validateQuestion, type QuestionInput } from '../lib/questions';
import type { Folder, Question } from '../lib/types';
import FolderGate from '../components/FolderGate';
import NotFound from './NotFound';
import { useToast } from '../components/Toast';
import { IconArrowLeft, IconBulb, IconCheck, IconPlus, IconTrash, Owl } from '../icons';

export default function EditQuestion() {
  const { folderId, questionId } = useParams();
  const site = useSite();
  return (
    <FolderGate folderId={folderId}>
      {(folder, role) =>
        site.role.isAdmin || ((role === 'owner' || role === 'editor') && site.canWrite) ? (
          <Editor folder={folder} questionId={questionId} />
        ) : (
          <NotFound title="Bạn không có quyền sửa" message="Chỉ chủ thư mục hoặc người được cấp quyền Sửa mới thêm câu hỏi được." />
        )
      }
    </FolderGate>
  );
}

const blank = (): QuestionInput => ({
  text: '',
  options: [0, 1, 2, 3].map(() => ({ id: newId(), text: '' })),
  correctIds: [],
  note: '',
});

function Editor({ folder, questionId }: { folder: Folder; questionId?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: questions, loading } = useQuestions(folder.id, true);
  const site = useSite();
  const isOwnerNotAdmin = user?.uid === folder.ownerId && !site.role.isAdmin;
  const quota = useMyQuota(isOwnerNotAdmin ? user?.uid : undefined);
  const qLeft = isOwnerNotAdmin && !quota.loading ? remaining(quota.maxQuestions, quota.questions) : Infinity;
  const existing: Question | undefined = questionId ? questions.find((q) => q.id === questionId) : undefined;

  const [form, setForm] = useState<QuestionInput>(blank);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(0);

  // Nạp dữ liệu câu hỏi cũ một lần (không ghi đè khi người khác sửa realtime trong lúc đang gõ).
  useEffect(() => {
    if (existing && loadedId !== existing.id) {
      setForm({ text: existing.text, options: existing.options, correctIds: existing.correctIds, note: existing.note });
      setLoadedId(existing.id);
    }
  }, [existing, loadedId]);

  if (questionId && !loading && !existing) return <NotFound title="Không tìm thấy câu hỏi" />;
  if (questionId && !existing) return <div className="card h-64 animate-pulse bg-surface/60" />;

  const toggleCorrect = (id: string) =>
    setForm((f) => ({
      ...f,
      correctIds: f.correctIds.includes(id) ? f.correctIds.filter((x) => x !== id) : [...f.correctIds, id],
    }));

  const save = async (andNext: boolean) => {
    const err = !existing && qLeft === 0 ? 'Bạn đã dùng hết hạn mức câu hỏi. Liên hệ admin nếu cần thêm.' : validateQuestion(form);
    setError(err);
    if (err || !user) return;
    setBusy(true);
    try {
      if (existing) {
        await updateQuestion(folder.id, existing.id, form, existing.order);
        toast('Đã lưu câu hỏi');
        navigate(`/f/${folder.id}`);
      } else {
        const order = questions.length ? questions[questions.length - 1].order + 1 : 0;
        await addQuestions(folder.id, folder.ownerId, user.uid, [form], order);
        setAdded((n) => n + 1);
        toast('Đã thêm câu hỏi');
        if (andNext) {
          setForm(blank());
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else navigate(`/f/${folder.id}`);
      }
    } catch (e) {
      console.error(e);
      toast(
        (e as { code?: string }).code === 'permission-denied' && !existing
          ? 'Không lưu được: đã vượt hạn mức câu hỏi của chủ thư mục'
          : 'Không lưu được, thử lại nhé!',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link to={`/f/${folder.id}`} className="btn-ghost -ml-2 self-start">
        <IconArrowLeft size={20} /> {folder.name}
      </Link>
      <div className="flex items-center gap-3">
        <Owl size={56} mood="think" />
        <div>
          <h1 className="text-2xl font-black">{existing ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</h1>
          {added > 0 && <p className="text-sm font-bold text-mint-500">Đã thêm {added} câu trong lượt này</p>}
          {!existing && qLeft !== Infinity && (
            <p className={`text-sm font-bold ${qLeft === 0 ? 'text-peach-500' : 'text-ink/50'}`}>
              {qLeft === 0 ? 'Đã hết hạn mức câu hỏi' : `Còn thêm được ${qLeft} câu theo hạn mức`}
            </p>
          )}
        </div>
      </div>

      <form
        className="card flex flex-col gap-5 p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
      >
        <div>
          <label className="label" htmlFor="qtext">Câu hỏi</label>
          <textarea
            id="qtext"
            className="input min-h-[90px] resize-y"
            autoFocus
            placeholder="Nhập nội dung câu hỏi…"
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          />
        </div>

        <div>
          <span className="label">
            Đáp án <span className="font-semibold text-ink/45">– bấm vòng tròn để đánh dấu đáp án đúng (chọn được nhiều)</span>
          </span>
          <ul className="flex flex-col gap-2">
            {form.options.map((o, i) => {
              const right = form.correctIds.includes(o.id);
              return (
                <li key={o.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(o.id)}
                    aria-label={right ? 'Bỏ đánh dấu đúng' : 'Đánh dấu là đáp án đúng'}
                    aria-pressed={right}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-black transition ${
                      right ? 'border-mint-500 bg-mint-500 text-white' : 'border-ink/15 bg-surface text-ink/50 hover:border-mint-300'
                    }`}
                  >
                    {right ? <IconCheck size={20} strokeWidth={3} /> : String.fromCharCode(65 + i)}
                  </button>
                  <input
                    className={`input ${right ? 'border-mint-300 bg-mint-100/40' : ''}`}
                    placeholder={`Đáp án ${String.fromCharCode(65 + i)}`}
                    value={o.text}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        options: f.options.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)),
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="btn-ghost p-2 text-rose-500"
                    disabled={form.options.length <= 2}
                    aria-label="Xóa đáp án"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        options: f.options.filter((x) => x.id !== o.id),
                        correctIds: f.correctIds.filter((x) => x !== o.id),
                      }))
                    }
                  >
                    <IconTrash size={18} />
                  </button>
                </li>
              );
            })}
          </ul>
          {form.options.length < 8 && (
            <button
              type="button"
              className="btn-ghost mt-2"
              onClick={() => setForm((f) => ({ ...f, options: [...f.options, { id: newId(), text: '' }] }))}
            >
              <IconPlus size={18} /> Thêm đáp án
            </button>
          )}
        </div>

        <div>
          <label className="label flex items-center gap-1.5" htmlFor="qnote">
            <IconBulb size={16} className="text-lemon-500" /> Ghi chú / giải thích (hiện sau khi trả lời)
          </label>
          <textarea
            id="qnote"
            className="input min-h-[80px] resize-y bg-lemon-100/40"
            placeholder="VD: Vì sao đáp án này đúng, mẹo ghi nhớ…"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          />
        </div>

        {error && <p className="animate-shake rounded-xl bg-rose-100 px-3 py-2 text-sm font-bold text-rose-500">{error}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to={`/f/${folder.id}`} className="btn-ghost">
            Hủy
          </Link>
          {!existing && (
            <button type="button" className="btn-soft" disabled={busy} onClick={() => save(true)}>
              Lưu & thêm câu tiếp
            </button>
          )}
          <button className="btn-primary" disabled={busy}>
            {existing ? 'Lưu thay đổi' : 'Lưu câu hỏi'}
          </button>
        </div>
      </form>
    </div>
  );
}
