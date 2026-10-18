import { useMemo, useState } from 'react';
import Modal from './Modal';
import { parseBulk } from '../lib/questions';
import type { QuestionInput } from '../lib/questions';

const SAMPLE = `Câu 1: Vị thuốc nào có tác dụng bổ khí?
A. Hoàng liên
*B. Nhân sâm
C. Đại hoàng
D. Ma hoàng
> Nhân sâm đại bổ nguyên khí.

Câu 2: Chọn các tạng thuộc ngũ tạng (nhiều đáp án đúng)
*A. Tâm
*B. Can
C. Đởm
*D. Tỳ`;

export default function BulkImportDialog({
  onClose,
  onImport,
  remaining = Infinity,
}: {
  onClose: () => void;
  onImport: (qs: QuestionInput[]) => Promise<void>;
  /** Số câu còn được thêm theo hạn mức (Infinity = không giới hạn / không biết). */
  remaining?: number;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const parsed = useMemo(() => parseBulk(text), [text]);

  return (
    <Modal title="Thêm nhanh nhiều câu" onClose={onClose} wide>
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl bg-lemon-100 p-3 text-sm leading-relaxed">
          <b>Cách viết:</b> mỗi câu cách nhau <b>1 dòng trống</b>. Đáp án bắt đầu bằng <code>A.</code> <code>B.</code>…,
          thêm dấu <code>*</code> trước đáp án đúng (có thể nhiều đáp án đúng). Dòng bắt đầu bằng <code>&gt;</code> là ghi
          chú / giải thích.
          <button className="ml-1 font-extrabold text-lilac-500 underline" onClick={() => setText(SAMPLE)}>
            Xem ví dụ
          </button>
        </div>
        <textarea
          className="input min-h-[260px] font-mono text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={SAMPLE}
        />
        {text.trim() && (
          <div className="text-sm">
            <span className="font-bold text-mint-500">Đọc được {parsed.questions.length} câu.</span>
            {parsed.questions.length > remaining && (
              <span className="ml-1 font-bold text-peach-500">
                Vượt hạn mức: bạn chỉ còn được thêm {remaining} câu.
              </span>
            )}
            {parsed.errors.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-rose-500">
                {parsed.errors.slice(0, 6).map((e) => (
                  <li key={e}>{e}</li>
                ))}
                {parsed.errors.length > 6 && <li>… và {parsed.errors.length - 6} lỗi khác</li>}
              </ul>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn-primary"
            disabled={busy || parsed.questions.length === 0 || parsed.questions.length > remaining}
            onClick={async () => {
              setBusy(true);
              try {
                await onImport(parsed.questions);
              } finally {
                setBusy(false);
              }
            }}
          >
            Thêm {parsed.questions.length || ''} câu
          </button>
        </div>
      </div>
    </Modal>
  );
}
