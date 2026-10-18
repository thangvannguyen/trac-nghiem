import type { Folder, Question } from '../lib/types';

/*
 * Xem danh sách câu hỏi dạng trang A4 như đề thi giấy. In / lưu PDF ra đúng khổ A4
 * (xem quy tắc @media print trong index.css: chỉ phần .print-area được in).
 */

const LETTER = (i: number) => String.fromCharCode(65 + i);

export default function QuestionPaper({
  folder,
  questions,
  showAnswers,
}: {
  folder: Folder;
  questions: Question[];
  showAnswers: boolean;
}) {
  const today = new Date().toLocaleDateString('vi-VN');
  const multiCount = questions.filter((q) => q.correctIds.length > 1).length;

  return (
    <div className="print-area -mx-4 overflow-x-auto bg-ink/[0.04] px-2 py-4 sm:mx-0 sm:rounded-blob sm:px-6 sm:py-8">
      <article
        className="paper mx-auto w-full max-w-[210mm] bg-white px-5 py-7 font-serif text-[15px] leading-relaxed text-black shadow-[0_2px_12px_rgba(59,51,85,0.15)] sm:min-h-[297mm] sm:px-[18mm] sm:py-[16mm]"
        style={{ fontFamily: '"Times New Roman", "Noto Serif", Georgia, serif' }}
      >
        {/* ---------- Đầu đề ---------- */}
        <header className="border-b-2 border-black pb-3 text-center">
          <div className="flex items-start justify-between gap-4 text-left text-[13px]">
            <div>
              <div className="font-bold uppercase">Cú Học Bài</div>
              <div className="italic">Bộ câu hỏi trắc nghiệm</div>
            </div>
            <div className="text-right">
              <div>Ngày: {today}</div>
              <div>Số câu: {questions.length}</div>
            </div>
          </div>
          <h1 className="mt-4 text-xl font-bold uppercase tracking-wide sm:text-2xl">{folder.name}</h1>
          {folder.description && <p className="mt-1 whitespace-pre-line text-sm italic">{folder.description}</p>}
        </header>

        {!showAnswers && (
          <div className="mt-4 grid gap-1 text-sm sm:grid-cols-[2fr_1fr]">
            <div>Họ và tên: ......................................................................</div>
            <div>Lớp: ...................................</div>
          </div>
        )}
        {multiCount > 0 && (
          <p className="mt-3 text-sm italic">
            Lưu ý: các câu có đánh dấu (*) có thể có nhiều hơn một đáp án đúng.
          </p>
        )}

        {/* ---------- Câu hỏi ---------- */}
        <ol className="mt-5 flex flex-col gap-4">
          {questions.map((q, i) => (
            <li key={q.id} className="break-inside-avoid">
              <p className="whitespace-pre-line">
                <b>Câu {i + 1}.</b>
                {q.correctIds.length > 1 && <b> (*)</b>} {q.text}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5 pl-4">
                {q.options.map((o, k) => {
                  const right = showAnswers && q.correctIds.includes(o.id);
                  return (
                    <li key={o.id} className="flex items-start gap-1.5">
                      <span className="inline-flex w-[1.6em] shrink-0 items-center font-bold">
                        {right ? (
                          <span className="inline-flex h-[1.35em] w-[1.35em] items-center justify-center rounded-full border-[1.5px] border-black leading-none">
                            {LETTER(k)}
                          </span>
                        ) : (
                          `${LETTER(k)}.`
                        )}
                      </span>
                      <span className={right ? 'font-bold underline decoration-1 underline-offset-2' : ''}>{o.text}</span>
                    </li>
                  );
                })}
              </ul>
              {showAnswers && q.note && (
                <p className="ml-4 mt-1 whitespace-pre-line border-l-2 border-black/30 pl-3 text-[14px] italic">
                  <b className="not-italic">Giải thích:</b> {q.note}
                </p>
              )}
            </li>
          ))}
        </ol>

        {/* ---------- Bảng đáp án ---------- */}
        {showAnswers && (
          <section className="mt-8 break-inside-avoid border-t-2 border-black pt-3">
            <h2 className="text-center font-bold uppercase">Bảng đáp án</h2>
            <div className="mt-2 grid grid-cols-5 border-l border-t border-black text-center text-sm sm:grid-cols-10">
              {questions.map((q, i) => (
                <div key={q.id} className="border-b border-r border-black px-1 py-0.5">
                  <span>{i + 1}.</span>{' '}
                  <b>
                    {q.options
                      .map((o, k) => (q.correctIds.includes(o.id) ? LETTER(k) : ''))
                      .filter(Boolean)
                      .join(',')}
                  </b>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-8 text-center text-xs italic text-black/60">— Hết —</footer>
      </article>
    </div>
  );
}
