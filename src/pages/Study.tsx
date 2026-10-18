import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useQuestions } from '../lib/questions';
import { reviewQueue, shuffle, useProgress } from '../lib/progress';
import { logSession, useUserDoc } from '../lib/stats';
import { useSite } from '../lib/site';
import {
  doc,
} from 'firebase/firestore';
import { setDoc } from '../lib/fs'; // có đếm quota ước tính
import { db } from '../lib/firebase';
import type { Folder, Option, Question } from '../lib/types';
import FolderGate from '../components/FolderGate';
import EmptyState from '../components/EmptyState';
import {
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconCard,
  IconCheck,
  IconPage,
  IconRefresh,
  IconRepeat,
  IconX,
  Owl,
  Trophy,
} from '../icons';

type Mode = 'learn' | 'test' | 'review';
const MODE_LABEL: Record<Mode, string> = { learn: 'Học', test: 'Kiểm tra', review: 'Ôn câu sai' };

interface Card {
  q: Question;
  options: Option[];
}

type Layout = 'one' | 'all';
type SheetStyle = 'cards' | 'paper';

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export default function Study() {
  const { folderId } = useParams();
  return <FolderGate folderId={folderId}>{(folder) => <StudyLoader folder={folder} />}</FolderGate>;
}

function StudyLoader({ folder }: { folder: Folder }) {
  const { uid } = useAuth();
  const [params, setParams] = useSearchParams();
  const mode = (['learn', 'test', 'review'].includes(params.get('mode') ?? '') ? params.get('mode') : 'learn') as Mode;
  // Cách làm bài: theo cài đặt của người dùng, không có thì theo mặc định hệ thống.
  const { config } = useSite();
  const me = useUserDoc(uid);
  const layout: Layout = me.data.studyLayout ?? config.defaultStudyLayout;
  const { data: all, loading } = useQuestions(folder.id, true);
  // Câu bị kiểm duyệt ẩn không bao giờ xuất hiện khi học / làm bài.
  const questions = all.filter((q) => !q.hidden);
  const progress = useProgress(folder.id, uid, folder.name);
  const [deck, setDeck] = useState<Card[] | null>(null);
  const [round, setRound] = useState(0);

  // Tạo bộ câu một lần cho mỗi lượt học, để cập nhật realtime không làm xáo trộn lúc đang làm bài.
  useEffect(() => {
    if (loading || !progress.loaded || deck) return;
    const source = mode === 'review' ? reviewQueue(questions, progress.stats) : questions;
    const ordered = mode === 'learn' ? source : shuffle(source);
    setDeck(ordered.map((q) => ({ q, options: mode === 'test' ? shuffle(q.options) : q.options })));
  }, [loading, progress.loaded, deck, mode, questions, progress.stats]);

  const restart = (next: Mode = mode) => {
    setDeck(null);
    setRound((r) => r + 1);
    if (next !== mode) setParams({ mode: next });
  };

  return (
    <div className={`mx-auto flex flex-col gap-4 ${layout === 'all' ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={`/f/${folder.id}`} className="btn-ghost -ml-2 min-w-0">
          <IconArrowLeft size={20} className="shrink-0" />
          <span className="truncate">{folder.name}</span>
        </Link>
        <div className="flex shrink-0 rounded-2xl bg-surface p-1 shadow-soft">
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => restart(m)}
              className={`rounded-xl px-3 py-1.5 text-sm font-extrabold transition ${
                m === mode ? 'bg-lilac-500 text-white' : 'text-ink/55 hover:text-ink'
              }`}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>
      </div>
      <div className="-mt-1 flex items-center justify-end gap-1.5 text-xs font-bold text-ink/45">
        {layout === 'all' ? <IconPage size={14} /> : <IconCard size={14} />}
        Cách làm bài: {layout === 'all' ? 'Cả bài' : 'Từng câu'} ·
        <Link to="/settings" className="text-lilac-500 underline-offset-2 hover:underline">
          Đổi trong Cài đặt
        </Link>
      </div>

      {!deck || me.loading ? (
        <div className="card h-80 animate-pulse bg-surface/60" />
      ) : deck.length === 0 ? (
        <EmptyState title={mode === 'review' ? 'Không có câu nào cần ôn' : 'Thư mục chưa có câu hỏi'}>
          {mode === 'review' && (
            <>
              <p className="text-sm text-ink/55">Tuyệt vời! Hãy làm bài Kiểm tra để tìm câu còn yếu nhé.</p>
              <button className="btn-test" onClick={() => restart('test')}>
                Làm bài kiểm tra
              </button>
            </>
          )}
        </EmptyState>
      ) : layout === 'all' ? (
        <Sheet
          key={`all-${mode}-${round}`}
          deck={deck}
          mode={mode}
          record={progress.record}
          onRestart={restart}
          folderId={folder.id}
          folderName={folder.name}
          uid={uid}
          sheetStyle={me.data.sheetStyle ?? 'cards'}
          onSheetStyle={(v) => uid && setDoc(doc(db, 'users', uid), { sheetStyle: v }, { merge: true }).catch(console.error)}
        />
      ) : (
        <Player
          key={`${mode}-${round}`}
          deck={deck}
          mode={mode}
          record={progress.record}
          onRestart={restart}
          folderId={folder.id}
          folderName={folder.name}
          uid={uid}
        />
      )}
    </div>
  );
}

function Player({
  deck,
  mode,
  record,
  onRestart,
  folderId,
  folderName,
  uid,
}: {
  deck: Card[];
  mode: Mode;
  record: (qid: string, correct: boolean) => void;
  onRestart: (m?: Mode) => void;
  folderId: string;
  folderName: string;
  uid?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finished, setFinishedState] = useState(false);

  // Kết thúc lượt: lưu lại để trang Thống kê hiển thị lịch sử.
  const setFinished = useCallback(
    (done: boolean) => {
      setFinishedState(done);
      if (!done || !uid) return;
      logSession(uid, {
        folderId,
        folderName,
        mode,
        total: deck.length,
        correct: deck.filter((c) => sameSet(answers[c.q.id] ?? [], c.q.correctIds)).length,
        durationSec: Math.round((Date.now() - startedAt) / 1000),
        endedAt: Date.now(),
      });
    },
    [uid, deck, answers, folderId, folderName, mode, startedAt],
  );

  const card = deck[idx];
  const multi = card.q.correctIds.length > 1;
  const selected = answers[card.q.id] ?? [];
  const isChecked = mode !== 'test' && checked[card.q.id];
  const last = idx === deck.length - 1;

  const check = useCallback(
    (sel: string[]) => {
      if (!sel.length) return;
      setChecked((c) => ({ ...c, [card.q.id]: true }));
      record(card.q.id, sameSet(sel, card.q.correctIds));
    },
    [card, record],
  );

  const choose = useCallback(
    (optionId: string) => {
      if (isChecked) return;
      const next = multi
        ? selected.includes(optionId)
          ? selected.filter((x) => x !== optionId)
          : [...selected, optionId]
        : [optionId];
      setAnswers((a) => ({ ...a, [card.q.id]: next }));
      // Câu 1 đáp án ở chế độ Học/Ôn: chấm luôn khi chọn.
      if (!multi && mode !== 'test') check(next);
    },
    [isChecked, multi, selected, card, mode, check],
  );

  const submitTest = useCallback(() => {
    const unanswered = deck.filter((c) => !(answers[c.q.id]?.length)).length;
    if (unanswered && !confirm(`Còn ${unanswered} câu chưa trả lời. Nộp bài luôn?`)) return;
    deck.forEach((c) => record(c.q.id, sameSet(answers[c.q.id] ?? [], c.q.correctIds)));
    setFinished(true);
  }, [deck, answers, record, setFinished]);

  const next = useCallback(() => {
    if (!last) setIdx((i) => i + 1);
    else if (mode === 'test') submitTest();
    else setFinished(true);
  }, [last, mode, submitTest, setFinished]);

  // Phím tắt: 1–8 chọn đáp án, Enter để kiểm tra / sang câu tiếp.
  useEffect(() => {
    if (finished) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
      const n = Number(e.key);
      if (n >= 1 && n <= card.options.length) choose(card.options[n - 1].id);
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (mode !== 'test' && !isChecked) check(selected);
        else next();
      } else if (e.key === 'ArrowLeft' && idx > 0) setIdx((i) => i - 1);
      else if (e.key === 'ArrowRight' && (mode === 'test' || isChecked)) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, card, choose, check, next, mode, isChecked, selected, idx]);

  if (finished) return <Results deck={deck} answers={answers} onRestart={onRestart} folderId={folderId} />;

  const correctNow = isChecked && sameSet(selected, card.q.correctIds);
  const answeredCount = deck.filter((c) => answers[c.q.id]?.length).length;

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-lilac-300 to-lilac-500 transition-all"
            style={{ width: `${((idx + (isChecked ? 1 : 0)) / deck.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-sm font-black text-ink/55">
          {idx + 1}/{deck.length}
        </span>
      </div>

      <div key={card.q.id} className="card animate-pop p-5 sm:p-7">
        <div className="mb-4 flex items-start gap-3">
          <Owl size={52} className="shrink-0" mood={!isChecked ? 'think' : correctNow ? 'happy' : 'sad'} />
          <div className="min-w-0">
            <p className="whitespace-pre-line text-lg font-extrabold leading-relaxed">{card.q.text}</p>
            {multi && <span className="chip mt-1 bg-lemon-100 text-ink/60">Chọn tất cả đáp án đúng</span>}
          </div>
        </div>

        <ul className="flex flex-col gap-2.5">
          {card.options.map((o, i) => {
            const isSel = selected.includes(o.id);
            const isRight = card.q.correctIds.includes(o.id);
            let cls = 'border-ink/10 bg-surface hover:border-lilac-300 hover:bg-lilac-100/40';
            if (isChecked) {
              if (isRight) cls = 'border-mint-500 bg-mint-100 text-mint-500';
              else if (isSel) cls = 'border-rose-500 bg-rose-100 text-rose-500 animate-shake';
              else cls = 'border-ink/5 bg-surface opacity-60';
            } else if (isSel) cls = 'border-lilac-500 bg-lilac-100';
            return (
              <li key={o.id}>
                <button
                  onClick={() => choose(o.id)}
                  disabled={isChecked}
                  className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold transition ${cls}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center text-sm font-black ${
                      multi ? 'rounded-lg' : 'rounded-full'
                    } ${isSel && !isChecked ? 'bg-lilac-500 text-white' : 'bg-ink/5'}`}
                  >
                    {isChecked && isRight ? (
                      <IconCheck size={18} strokeWidth={3} />
                    ) : isChecked && isSel ? (
                      <IconX size={18} strokeWidth={3} />
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="flex-1 text-ink">{o.text}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {isChecked && (
          <div className="animate-pop mt-4 flex flex-col gap-2">
            <div className={`rounded-2xl px-4 py-2.5 font-black ${correctNow ? 'bg-mint-100 text-mint-500' : 'bg-rose-100 text-rose-500'}`}>
              {correctNow ? 'Chính xác! Giỏi quá!' : 'Chưa đúng rồi, xem lại nhé!'}
            </div>
            {card.q.note && (
              <div className="flex gap-2 border-l-2 border-lemon-300 pl-3 text-sm text-ink/70 py-0.5">
                <IconBulb size={16} className="mt-0.5 shrink-0 text-lemon-500" />
                <p className="whitespace-pre-line">{card.q.note}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button className="btn-ghost" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)}>
          <IconArrowLeft size={20} /> Trước
        </button>
        {mode === 'test' ? (
          <div className="flex gap-2">
            {!last && (
              <button className="btn-soft" onClick={submitTest}>
                Nộp bài ({answeredCount}/{deck.length})
              </button>
            )}
            <button className="btn-primary" onClick={next}>
              {last ? 'Nộp bài' : 'Câu tiếp'} <IconArrowRight size={20} />
            </button>
          </div>
        ) : !isChecked ? (
          <button className="btn-primary" disabled={!selected.length} onClick={() => check(selected)}>
            Kiểm tra
          </button>
        ) : (
          <button className="btn-primary" onClick={next}>
            {last ? 'Xem kết quả' : 'Câu tiếp'} <IconArrowRight size={20} />
          </button>
        )}
      </div>
      <p className="hidden text-center text-xs font-semibold text-ink/35 sm:block">
        Mẹo: phím 1–{card.options.length} để chọn, Enter để tiếp tục
      </p>
    </>
  );
}

/* ================= Cả bài: hiện toàn bộ câu trên 1 trang như thi trắc nghiệm ================= */

const fmtClock = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(h ? 2 : 1, '0')}:${String(s).padStart(2, '0')}`;
};

function Sheet({
  deck,
  mode,
  record,
  onRestart,
  folderId,
  folderName,
  uid,
  sheetStyle,
  onSheetStyle,
}: {
  deck: Card[];
  mode: Mode;
  record: (qid: string, correct: boolean) => void;
  onRestart: (m?: Mode) => void;
  folderId: string;
  folderName: string;
  uid?: string;
  sheetStyle: SheetStyle;
  onSheetStyle: (v: SheetStyle) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [showNav, setShowNav] = useState(false);
  const exam = mode === 'test';

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  const answered = deck.filter((c) => answers[c.q.id]?.length).length;
  const checkedCount = deck.filter((c) => checked[c.q.id]).length;
  const elapsed = Math.floor((now - startedAt) / 1000);

  const check = (c: Card, sel: string[]) => {
    if (!sel.length || checked[c.q.id]) return;
    setChecked((x) => ({ ...x, [c.q.id]: true }));
    record(c.q.id, sameSet(sel, c.q.correctIds));
  };

  const choose = (c: Card, optionId: string) => {
    if (!exam && checked[c.q.id]) return;
    const multi = c.q.correctIds.length > 1;
    const cur = answers[c.q.id] ?? [];
    const next = multi ? (cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId]) : [optionId];
    setAnswers((a) => ({ ...a, [c.q.id]: next }));
    if (!exam && !multi) check(c, next);
  };

  const finish = () => {
    if (exam) {
      const left = deck.length - answered;
      if (left && !confirm(`Còn ${left} câu chưa trả lời. Nộp bài luôn?`)) return;
      deck.forEach((c) => record(c.q.id, sameSet(answers[c.q.id] ?? [], c.q.correctIds)));
    }
    if (uid)
      logSession(uid, {
        folderId,
        folderName,
        mode,
        total: deck.length,
        correct: deck.filter((c) => sameSet(answers[c.q.id] ?? [], c.q.correctIds)).length,
        durationSec: elapsed,
        endedAt: Date.now(),
      });
    setFinished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jump = (i: number) => {
    document.getElementById(`sq-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShowNav(false);
  };

  if (finished) return <Results deck={deck} answers={answers} onRestart={onRestart} folderId={folderId} />;

  const done = exam ? answered : checkedCount;
  const navigator = (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(36px,1fr))] gap-1.5">
      {deck.map((c, i) => {
        const has = !!answers[c.q.id]?.length;
        const isChecked = !exam && checked[c.q.id];
        const right = isChecked && sameSet(answers[c.q.id] ?? [], c.q.correctIds);
        return (
          <button
            key={c.q.id}
            onClick={() => jump(i)}
            title={`Câu ${i + 1}`}
            className={`flex h-9 items-center justify-center rounded-lg text-sm font-black tabular-nums transition ${
              isChecked
                ? right
                  ? 'bg-mint-500 text-white'
                  : 'bg-rose-500 text-white'
                : has
                  ? 'bg-lilac-500 text-white'
                  : 'bg-ink/5 text-ink/60 hover:bg-lilac-100'
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );

  // Nội dung 1 câu hỏi – dùng chung cho kiểu Thẻ và kiểu Trang (gộp 1 khung).
  // Kiểu "Gộp trang": câu hỏi & đáp án như văn bản in, mỗi đáp án 1 dòng "A. …", không viền / bo góc.
  const renderPlain = (c: Card, i: number) => {
    const multi = c.q.correctIds.length > 1;
    const sel = answers[c.q.id] ?? [];
    const isChecked = !exam && !!checked[c.q.id];
    const right = isChecked && sameSet(sel, c.q.correctIds);
    return (
      <div>
        <p className="whitespace-pre-line leading-relaxed">
          <b>Câu {i + 1}.</b>{' '}
          <span className="font-bold">{c.q.text}</span>
          {multi && <span className="ml-1.5 text-sm font-semibold text-ink/45">(chọn tất cả đáp án đúng)</span>}
        </p>
        <ul className="mt-1.5 flex flex-col">
          {c.options.map((o, k) => {
            const isSel = sel.includes(o.id);
            const isRight = c.q.correctIds.includes(o.id);
            const mark = isChecked
              ? isRight
                ? 'border-mint-500 bg-mint-500 text-white'
                : isSel
                  ? 'border-rose-500 bg-rose-500 text-white'
                  : 'border-transparent text-ink/40'
              : isSel
                ? 'border-lilac-500 bg-lilac-500 text-white'
                : 'border-transparent group-hover:border-lilac-300 group-hover:text-lilac-500';
            const text = isChecked
              ? isRight
                ? 'font-bold text-mint-500'
                : isSel
                  ? 'text-rose-500 line-through'
                  : 'text-ink/50'
              : isSel
                ? 'font-bold text-ink'
                : 'text-ink/80';
            return (
              <li key={o.id}>
                <button
                  onClick={() => choose(c, o.id)}
                  disabled={isChecked}
                  className="group flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-lilac-100/40 disabled:hover:bg-transparent"
                >
                  <span
                    className={`mt-px inline-flex h-6 w-6 shrink-0 items-center justify-center border-[1.5px] text-[13px] font-extrabold transition ${
                      multi ? 'rounded-md' : 'rounded-full'
                    } ${mark}`}
                  >
                    {String.fromCharCode(65 + k)}
                  </span>
                  <span className={`pt-px ${text}`}>{o.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {!exam && multi && !isChecked && (
          <button
            className="ml-1.5 mt-1 text-sm font-extrabold text-lilac-500 underline-offset-2 hover:underline disabled:text-ink/30 disabled:no-underline"
            disabled={!sel.length}
            onClick={() => check(c, sel)}
          >
            Kiểm tra câu này
          </button>
        )}
        {isChecked && (
          <div className="animate-pop ml-1.5 mt-1 text-sm">
            <span className={`inline-flex items-center gap-1 font-extrabold ${right ? 'text-mint-500' : 'text-rose-500'}`}>
              {right ? <IconCheck size={15} strokeWidth={3} /> : <IconX size={15} strokeWidth={3} />}
              {right
                ? 'Chính xác!'
                : `Chưa đúng – đáp án đúng: ${c.options
                    .map((o, k) => (c.q.correctIds.includes(o.id) ? String.fromCharCode(65 + k) : ''))
                    .filter(Boolean)
                    .join(', ')}`}
            </span>
            {c.q.note && (
              <p className="mt-0.5 flex gap-1.5 text-ink/65">
                <IconBulb size={16} className="mt-0.5 shrink-0 text-lemon-500" />
                <span className="whitespace-pre-line">{c.q.note}</span>
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderQuestion = (c: Card, i: number) => {
    const multi = c.q.correctIds.length > 1;
    const sel = answers[c.q.id] ?? [];
    const isChecked = !exam && !!checked[c.q.id];
    const right = isChecked && sameSet(sel, c.q.correctIds);
    return (
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-xl px-1.5 text-sm font-black ${
            isChecked ? (right ? 'bg-mint-100 text-mint-500' : 'bg-rose-100 text-rose-500') : sel.length ? 'bg-lilac-500 text-white' : 'bg-lilac-100 text-lilac-500'
          }`}
        >
          {i + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-line font-extrabold leading-relaxed">{c.q.text}</p>
          {multi && <span className="chip mt-1 bg-lemon-100 text-ink/60">Chọn tất cả đáp án đúng</span>}
          <ul className="mt-3 flex flex-col gap-2">
            {c.options.map((o, k) => {
              const isSel = sel.includes(o.id);
              const isRight = c.q.correctIds.includes(o.id);
              let cls = 'border-ink/10 bg-surface hover:border-lilac-300 hover:bg-lilac-100/40';
              if (isChecked) {
                if (isRight) cls = 'border-mint-500 bg-mint-100';
                else if (isSel) cls = 'border-rose-500 bg-rose-100';
                else cls = 'border-ink/5 bg-surface opacity-60';
              } else if (isSel) cls = 'border-lilac-500 bg-lilac-100';
              return (
                <li key={o.id}>
                  <button
                    onClick={() => choose(c, o.id)}
                    disabled={isChecked}
                    className={`flex w-full items-center gap-2.5 rounded-xl border-2 px-3 py-2 text-left text-sm font-bold transition ${cls}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center text-xs font-black ${multi ? 'rounded-md' : 'rounded-full'} ${
                        isSel && !isChecked ? 'bg-lilac-500 text-white' : 'bg-ink/5'
                      }`}
                    >
                      {isChecked && isRight ? <IconCheck size={15} strokeWidth={3} /> : isChecked && isSel ? <IconX size={15} strokeWidth={3} /> : String.fromCharCode(65 + k)}
                    </span>
                    <span className="flex-1">{o.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!exam && multi && !isChecked && (
            <button className="btn-soft mt-2 px-3 py-1.5 text-sm" disabled={!sel.length} onClick={() => check(c, sel)}>
              Kiểm tra câu này
            </button>
          )}
          {isChecked && (
            <div className="animate-pop mt-3 flex flex-col gap-2">
              <div className={`rounded-xl px-3 py-2 text-sm font-black ${right ? 'bg-mint-100 text-mint-500' : 'bg-rose-100 text-rose-500'}`}>
                {right ? 'Chính xác!' : 'Chưa đúng – đáp án đúng được tô xanh.'}
              </div>
              {c.q.note && (
                <div className="flex gap-2 border-l-2 border-lemon-300 pl-3 text-sm text-ink/70">
                  <IconBulb size={16} className="mt-0.5 shrink-0 text-lemon-500" />
                  <p className="whitespace-pre-line">{c.q.note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      {sheetStyle === 'paper' ? (
        <div className="flex min-w-0 flex-col gap-3">
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-ink/5 bg-lilac-100/40 px-4 py-3 sm:px-6">
              <h2 className="min-w-0 truncate font-black">{folderName}</h2>
              <span className="shrink-0 text-sm font-bold text-ink/50">{deck.length} câu</span>
            </header>
            <ol className="divide-y divide-ink/5">
              {deck.map((c, i) => (
                <li key={c.q.id} id={`sq-${i}`} className="scroll-mt-24 px-4 py-4 sm:px-6 sm:py-5">
                  {renderPlain(c, i)}
                </li>
              ))}
            </ol>
          </section>
          <div className="flex justify-center py-2">
            <button className="btn-primary px-6 py-3 text-lg" onClick={finish}>
              {exam ? 'Nộp bài' : 'Xem kết quả'}
            </button>
          </div>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {deck.map((c, i) => (
            <li key={c.q.id} id={`sq-${i}`} className="card scroll-mt-24 p-4 sm:p-5">
              {renderQuestion(c, i)}
            </li>
          ))}
            <li className="flex justify-center py-2">
            <button className="btn-primary px-6 py-3 text-lg" onClick={finish}>
              {exam ? 'Nộp bài' : 'Xem kết quả'}
            </button>
          </li>
        </ol>
      )}

      {/* Bảng bài làm – cột trái trên máy tính */}
      <aside className="hidden lg:order-first lg:block">
        <div className="card sticky top-20 flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-black">Bài làm</span>
            <span className="rounded-lg bg-ink/5 px-2 py-0.5 font-black tabular-nums">{fmtClock(elapsed)}</span>
          </div>
          <div className="text-sm font-bold text-ink/55">
            {exam ? 'Đã làm' : 'Đã kiểm tra'} {done}/{deck.length}
          </div>
          <div className="flex rounded-xl bg-ink/5 p-0.5" role="group" aria-label="Kiểu hiển thị">
              {(
                [
                  ['cards', 'Thẻ', IconCard],
                  ['paper', 'Gộp trang', IconPage],
                ] as const
              ).map(([k, label, Icon]) => (
                <button
                  key={k}
                  aria-pressed={sheetStyle === k}
                  onClick={() => onSheetStyle(k)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-extrabold transition ${
                    sheetStyle === k ? 'bg-surface text-ink shadow-sm' : 'text-ink/50 hover:text-ink'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          <div className="max-h-[50vh] overflow-y-auto pr-1">{navigator}</div>
          <button className="btn-primary w-full" onClick={finish}>
            {exam ? 'Nộp bài' : 'Xem kết quả'}
          </button>
        </div>
      </aside>

      {/* Thanh dưới cùng – điện thoại / máy tính bảng */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-cream/95 px-4 py-2.5 backdrop-blur lg:hidden">
        {showNav && (
          <div className="mx-auto mb-3 flex max-w-2xl flex-col gap-2">
            <div className="flex rounded-xl bg-ink/5 p-0.5" role="group" aria-label="Kiểu hiển thị">
              {(
                [
                  ['cards', 'Thẻ', IconCard],
                  ['paper', 'Gộp trang', IconPage],
                ] as const
              ).map(([k, label, Icon]) => (
                <button
                  key={k}
                  aria-pressed={sheetStyle === k}
                  onClick={() => onSheetStyle(k)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs font-extrabold transition ${
                    sheetStyle === k ? 'bg-surface text-ink shadow-sm' : 'text-ink/50 hover:text-ink'
                  }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
            <div className="max-h-[40vh] overflow-y-auto">{navigator}</div>
          </div>
        )}
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button className="btn-soft px-3 py-2 text-sm" onClick={() => setShowNav((s) => !s)}>
            {done}/{deck.length} câu
          </button>
          <span className="rounded-lg bg-ink/5 px-2 py-1 text-sm font-black tabular-nums">{fmtClock(elapsed)}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-lilac-500 transition-all" style={{ width: `${(done / deck.length) * 100}%` }} />
          </div>
          <button className="btn-primary px-4 py-2 text-sm" onClick={finish}>
            {exam ? 'Nộp bài' : 'Kết quả'}
          </button>
        </div>
      </div>
      <div className="h-16 lg:hidden" />
    </div>
  );
}

function Results({
  deck,
  answers,
  onRestart,
  folderId,
}: {
  deck: Card[];
  answers: Record<string, string[]>;
  onRestart: (m?: Mode) => void;
  folderId: string;
}) {
  const wrong = deck.filter((c) => !sameSet(answers[c.q.id] ?? [], c.q.correctIds));
  const score = deck.length - wrong.length;
  const pct = Math.round((score / deck.length) * 100);
  const msg = pct === 100 ? 'Hoàn hảo! Đúng hết luôn!' : pct >= 80 ? 'Xuất sắc! Sắp thuộc hết rồi!' : pct >= 50 ? 'Khá lắm! Ôn thêm chút nữa nhé!' : 'Cố lên! Ôn lại câu sai là nhớ ngay!';

  return (
    <div className="flex flex-col gap-4">
      <div className="card animate-pop flex flex-col items-center gap-2 p-7 text-center">
        {pct >= 80 ? <Trophy size={96} /> : <Owl size={96} mood={pct >= 50 ? 'happy' : 'sad'} />}
        <div className="text-5xl font-black text-lilac-500">
          {score}/{deck.length}
        </div>
        <div className="font-extrabold text-ink/60">
          {pct}% · {msg}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button className="btn-primary" onClick={() => onRestart()}>
            <IconRefresh size={18} /> Làm lại
          </button>
          {wrong.length > 0 && (
            <button className="btn-review" onClick={() => onRestart('review')}>
              <IconRepeat size={18} /> Ôn câu sai
            </button>
          )}
          <Link to={`/f/${folderId}`} className="btn-soft">
            Về thư mục
          </Link>
        </div>
      </div>

      {wrong.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-black">Xem lại {wrong.length} câu sai</h2>
          <ol className="flex flex-col gap-3">
            {wrong.map((c) => {
              const mine = answers[c.q.id] ?? [];
              return (
                <li key={c.q.id} className="card p-4">
                  <p className="whitespace-pre-line font-bold">{c.q.text}</p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {c.options
                      .filter((o) => c.q.correctIds.includes(o.id) || mine.includes(o.id))
                      .map((o) => {
                        const right = c.q.correctIds.includes(o.id);
                        return (
                          <li
                            key={o.id}
                            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-bold ${
                              right ? 'bg-mint-100 text-mint-500' : 'bg-rose-100 text-rose-500'
                            }`}
                          >
                            {right ? <IconCheck size={16} /> : <IconX size={16} />}
                            <span className="text-ink">{o.text}</span>
                          </li>
                        );
                      })}
                    {mine.length === 0 && <li className="px-3 text-ink/45">(Bạn chưa trả lời)</li>}
                  </ul>
                  {c.q.note && (
                    <div className="mt-2 flex gap-2 border-l-2 border-lemon-300 pl-3 text-sm text-ink/70">
                      <IconBulb size={16} className="mt-0.5 shrink-0 text-lemon-500" />
                      <p className="whitespace-pre-line">{c.q.note}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
