import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { track } from './analytics';
import type { Option, Question } from './types';

export const newId = () => Math.random().toString(36).slice(2, 10);

export interface QuestionInput {
  text: string;
  options: Option[];
  correctIds: string[];
  note: string;
}

export function useQuestions(folderId: string | undefined, enabled: boolean) {
  const [state, setState] = useState<{ data: Question[]; loading: boolean }>({ data: [], loading: true });
  useEffect(() => {
    if (!folderId || !enabled) return;
    return onSnapshot(
      query(collection(db, 'folders', folderId, 'questions'), orderBy('order', 'asc')),
      (snap) =>
        setState({
          data: snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: 'estimate' }) as Omit<Question, 'id'>) })),
          loading: false,
        }),
      (err) => {
        console.error(err);
        setState({ data: [], loading: false });
      },
    );
  }, [folderId, enabled]);
  return state;
}

/** Kiểm tra dữ liệu trước khi lưu; trả về thông báo lỗi hoặc null. */
export function validateQuestion(q: QuestionInput): string | null {
  if (!q.text.trim()) return 'Bạn chưa nhập nội dung câu hỏi.';
  const filled = q.options.filter((o) => o.text.trim());
  if (filled.length < 2) return 'Cần ít nhất 2 đáp án.';
  if (filled.length > 8) return 'Tối đa 8 đáp án.';
  const ids = new Set(filled.map((o) => o.id));
  if (!q.correctIds.some((id) => ids.has(id))) return 'Hãy đánh dấu ít nhất 1 đáp án đúng.';
  return null;
}

function clean(q: QuestionInput): QuestionInput {
  const options = q.options.filter((o) => o.text.trim()).map((o) => ({ id: o.id, text: o.text.trim() }));
  const ids = new Set(options.map((o) => o.id));
  return { text: q.text.trim(), options, correctIds: q.correctIds.filter((id) => ids.has(id)), note: q.note.trim() };
}

/** Thêm câu hỏi + tăng bộ đếm câu hỏi của CHỦ thư mục (ownerId) trong cùng batch để luật kiểm tra hạn mức. */
export async function addQuestions(folderId: string, ownerId: string, uid: string, inputs: QuestionInput[], startOrder: number) {
  // Mỗi batch tối đa 500 thao tác; chừa 1 chỗ cho cập nhật bộ đếm thư mục.
  for (let i = 0; i < inputs.length; i += 400) {
    const chunk = inputs.slice(i, i + 400);
    const batch = writeBatch(db);
    chunk.forEach((input, j) => {
      batch.set(doc(collection(db, 'folders', folderId, 'questions')), {
        ...clean(input),
        order: startOrder + i + j,
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    batch.update(doc(db, 'folders', folderId), { questionCount: increment(chunk.length), updatedAt: serverTimestamp() });
    batch.set(doc(db, 'usage', ownerId), { questions: increment(chunk.length), lastQFolder: folderId }, { merge: true });
    await batch.commit();
  }
  track('add_questions', { count: inputs.length });
}

export async function updateQuestion(folderId: string, questionId: string, input: QuestionInput, order: number) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'folders', folderId, 'questions', questionId), {
    ...clean(input),
    order,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, 'folders', folderId), { updatedAt: serverTimestamp() });
  await batch.commit();
}

export async function deleteQuestion(folderId: string, ownerId: string, questionId: string) {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'folders', folderId, 'questions', questionId));
  batch.update(doc(db, 'folders', folderId), { questionCount: increment(-1), updatedAt: serverTimestamp() });
  batch.set(doc(db, 'usage', ownerId), { questions: increment(-1), lastQFolder: folderId }, { merge: true });
  await batch.commit();
}

/** Đổi chỗ thứ tự 2 câu hỏi. */
export async function swapOrder(folderId: string, a: Question, b: Question) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'folders', folderId, 'questions', a.id), { order: b.order });
  batch.update(doc(db, 'folders', folderId, 'questions', b.id), { order: a.order });
  await batch.commit();
}

const OPTION_RE = /^(\*?)\s*([A-Ha-h])[.)]\s+(.*?)\s*(\*?)$/;
const NUMBER_RE = /^(câu\s*)?\d+\s*[.:)]\s*/i;

/**
 * Đọc nhiều câu hỏi từ văn bản. Mỗi câu cách nhau bằng 1 dòng trống:
 *   Câu 1: Nội dung câu hỏi
 *   A. Đáp án
 *   *B. Đáp án đúng (dấu * ở đầu hoặc cuối)
 *   > Ghi chú / giải thích
 */
export function parseBulk(text: string): { questions: QuestionInput[]; errors: string[] } {
  const blocks = text.replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const questions: QuestionInput[] = [];
  const errors: string[] = [];

  blocks.forEach((block, idx) => {
    const qLines: string[] = [];
    const noteLines: string[] = [];
    const options: Option[] = [];
    const correctIds: string[] = [];
    for (const raw of block.split('\n')) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('>')) {
        noteLines.push(line.slice(1).trim());
        continue;
      }
      const m = line.match(OPTION_RE);
      if (m && (options.length > 0 || qLines.length > 0)) {
        const id = newId();
        options.push({ id, text: m[3] });
        if (m[1] || m[4]) correctIds.push(id);
      } else if (options.length === 0) {
        qLines.push(line);
      } else {
        // Dòng tiếp nối của đáp án trước đó.
        options[options.length - 1].text += ' ' + line;
      }
    }
    const q: QuestionInput = {
      text: qLines.join('\n').replace(NUMBER_RE, ''),
      options,
      correctIds,
      note: noteLines.join('\n'),
    };
    const err = validateQuestion(q);
    if (err) errors.push(`Câu ${idx + 1}: ${err}`);
    else questions.push(q);
  });

  return { questions, errors };
}
