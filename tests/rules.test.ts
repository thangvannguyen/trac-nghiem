import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

let env: RulesTestEnvironment;

const folder = (over: Record<string, unknown> = {}) => ({
  ownerId: 'alice',
  ownerName: 'Alice',
  ownerPhoto: '',
  name: 'Dược lý',
  description: '',
  color: 'lilac',
  icon: 'book',
  visibility: 'private',
  viewerEmails: ['viewer@x.com'],
  editorEmails: ['editor@x.com'],
  questionCount: 0,
  ...over,
});

const question = { text: 'Q?', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctIds: ['a'], note: '', order: 0, createdBy: 'alice' };

const as = (uid: string, email: string) => env.authenticatedContext(uid, { email }).firestore();
const guest = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-trac-nghiem',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'folders/priv'), folder());
    await setDoc(doc(db, 'folders/linkf'), folder({ visibility: 'link' }));
    await setDoc(doc(db, 'folders/pub'), folder({ visibility: 'public' }));
    await setDoc(doc(db, 'folders/priv/questions/q1'), question);
  });
});

describe('folders', () => {
  it('khách đọc được public & link, không đọc được private', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'folders/pub')));
    await assertSucceeds(getDoc(doc(guest(), 'folders/linkf')));
    await assertFails(getDoc(doc(guest(), 'folders/priv')));
  });

  it('khách chỉ liệt kê được public, không liệt kê được link', async () => {
    await assertSucceeds(getDocs(query(collection(guest(), 'folders'), where('visibility', '==', 'public'))));
    await assertFails(getDocs(query(collection(guest(), 'folders'), where('visibility', '==', 'link'))));
    await assertFails(getDocs(collection(guest(), 'folders')));
  });

  it('người được mời đọc & liệt kê được thư mục private', async () => {
    const db = as('bob', 'Viewer@x.com');
    await assertSucceeds(getDoc(doc(db, 'folders/priv')));
    await assertSucceeds(getDocs(query(collection(db, 'folders'), where('viewerEmails', 'array-contains', 'viewer@x.com'))));
    await assertFails(getDoc(doc(as('eve', 'eve@x.com'), 'folders/priv')));
  });

  it('chỉ đăng nhập mới tạo được thư mục, và phải là của mình', async () => {
    await assertFails(setDoc(doc(guest(), 'folders/n1'), folder({ ownerId: 'x' })));
    await assertFails(setDoc(doc(as('bob', 'b@x.com'), 'folders/n2'), folder()));
    await assertSucceeds(setDoc(doc(as('alice', 'a@x.com'), 'folders/n3'), folder({ viewerEmails: [], editorEmails: [] })));
  });

  it('editor chỉ đổi được bộ đếm, không đổi được quyền chia sẻ', async () => {
    const db = as('ed', 'editor@x.com');
    await assertSucceeds(updateDoc(doc(db, 'folders/priv'), { questionCount: 1 }));
    await assertFails(updateDoc(doc(db, 'folders/priv'), { visibility: 'public' }));
    await assertFails(deleteDoc(doc(db, 'folders/priv')));
    await assertSucceeds(updateDoc(doc(as('alice', 'a@x.com'), 'folders/priv'), { visibility: 'public' }));
  });
});

describe('questions', () => {
  it('quyền đọc theo thư mục cha', async () => {
    await assertFails(getDocs(collection(guest(), 'folders/priv/questions')));
    await assertSucceeds(getDocs(collection(as('v', 'viewer@x.com'), 'folders/priv/questions')));
  });

  it('owner & editor ghi được, viewer & khách thì không', async () => {
    await assertSucceeds(setDoc(doc(as('alice', 'a@x.com'), 'folders/priv/questions/q2'), question));
    await assertSucceeds(setDoc(doc(as('ed', 'editor@x.com'), 'folders/priv/questions/q3'), question));
    await assertFails(setDoc(doc(as('v', 'viewer@x.com'), 'folders/priv/questions/q4'), question));
    await assertFails(setDoc(doc(guest(), 'folders/pub/questions/q5'), question));
  });

  it('chặn câu hỏi sai định dạng', async () => {
    await assertFails(setDoc(doc(as('alice', 'a@x.com'), 'folders/priv/questions/bad'), { ...question, options: [{ id: 'a', text: 'A' }] }));
    await assertFails(setDoc(doc(as('alice', 'a@x.com'), 'folders/priv/questions/bad2'), { ...question, correctIds: [] }));
  });
});

describe('progress', () => {
  it('chỉ chính chủ đọc/ghi', async () => {
    await assertSucceeds(setDoc(doc(as('bob', 'b@x.com'), 'users/bob/progress/priv'), { stats: {} }));
    await assertFails(getDoc(doc(as('eve', 'e@x.com'), 'users/bob/progress/priv')));
  });
});

describe('phân quyền admin', () => {
  const root = () => env.authenticatedContext('root', { email: 'thagvip1@gmail.com', email_verified: true }).firestore();
  const anon = () => env.authenticatedContext('anon1', { firebase: { sign_in_provider: 'anonymous' } } as never).firestore();

  it('user thường không tự cấp admin, admin gốc thì cấp được', async () => {
    await assertFails(setDoc(doc(as('bob', 'b@x.com'), 'admins/bob'), { email: 'b@x.com' }));
    await assertSucceeds(setDoc(doc(root(), 'admins/bob'), { email: 'b@x.com' }));
    // bob giờ là admin: đọc được danh sách người dùng
    await assertSucceeds(getDocs(collection(as('bob', 'b@x.com'), 'users')));
    await assertFails(getDocs(collection(as('eve', 'e@x.com'), 'users')));
  });

  it('admin không tự thu hồi chính mình', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'admins/bob'), { email: 'b@x.com' }));
    await assertFails(deleteDoc(doc(as('bob', 'b@x.com'), 'admins/bob')));
    await assertSucceeds(deleteDoc(doc(root(), 'admins/bob')));
  });

  it('chỉ admin đánh dấu nổi bật', async () => {
    await assertFails(updateDoc(doc(as('alice', 'a@x.com'), 'folders/pub'), { featured: true }));
    await assertSucceeds(updateDoc(doc(root(), 'folders/pub'), { featured: true }));
  });

  it('bị khóa thì không tạo được thư mục', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'bans/alice'), { reason: 'spam' }));
    await assertFails(setDoc(doc(as('alice', 'a@x.com'), 'folders/n9'), folder({ viewerEmails: [], editorEmails: [] })));
  });

  it('chế độ bảo trì chặn user thường, admin vẫn sửa được', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'config/app'), { readOnly: true }));
    await assertFails(setDoc(doc(as('alice', 'a@x.com'), 'folders/priv/questions/q9'), question));
    await assertSucceeds(setDoc(doc(root(), 'folders/priv/questions/q9'), question));
  });

  it('khách ẩn danh lưu được tiến độ của mình nhưng không tạo thư mục', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'users/anon1/progress/pub'), { stats: {} }));
    await assertFails(setDoc(doc(anon(), 'folders/a1'), folder({ ownerId: 'anon1', viewerEmails: [], editorEmails: [] })));
  });
});

describe('hạn mức thư mục / câu hỏi', () => {
  const newFolder = async (db: ReturnType<typeof as>, uid: string, id: string) => {
    const { writeBatch, increment } = await import('firebase/firestore');
    const b = writeBatch(db);
    b.set(doc(db, `usage/${uid}`), { folders: increment(1), lastFolder: id }, { merge: true });
    b.set(doc(db, `folders/${id}`), folder({ ownerId: uid, viewerEmails: [], editorEmails: [] }));
    return b.commit();
  };

  it('mặc định tạo tối đa 5 thư mục', async () => {
    const db = as('carl', 'c@x.com');
    for (let i = 0; i < 5; i++) await assertSucceeds(newFolder(db, 'carl', `c${i}`));
    await assertFails(newFolder(db, 'carl', 'c5'));
  });

  it('không tạo thư mục mà không tăng bộ đếm', async () => {
    await assertFails(setDoc(doc(as('carl', 'c@x.com'), 'folders/x1'), folder({ ownerId: 'carl', viewerEmails: [], editorEmails: [] })));
  });

  it('không tự giảm bộ đếm thư mục', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'usage/carl'), { folders: 5, questions: 0 }));
    await assertFails(setDoc(doc(as('carl', 'c@x.com'), 'usage/carl'), { folders: 0, questions: 0 }));
  });

  it('admin đặt hạn mức riêng; user không tự đặt', async () => {
    await assertFails(setDoc(doc(as('carl', 'c@x.com'), 'limits/carl'), { maxFolders: 999 }));
    const root = env.authenticatedContext('root', { email: 'thagvip1@gmail.com', email_verified: true }).firestore();
    await assertSucceeds(setDoc(doc(root, 'limits/carl'), { maxFolders: 6, maxQuestions: -1 }));
  });
});

describe('kiểm duyệt viên', () => {
  const mod = () => as('mod1', 'mod@x.com');
  beforeEach(() => env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'moderators/mod1'), { email: 'mod@x.com' })));

  it('xem được thư mục riêng tư và câu hỏi', async () => {
    await assertSucceeds(getDoc(doc(mod(), 'folders/priv')));
    await assertSucceeds(getDocs(collection(mod(), 'folders/priv/questions')));
  });

  it('ẩn được câu hỏi nhưng không sửa nội dung', async () => {
    await assertSucceeds(updateDoc(doc(mod(), 'folders/priv/questions/q1'), { hidden: true, hiddenReason: 'spam' }));
    await assertFails(updateDoc(doc(mod(), 'folders/priv/questions/q1'), { text: 'sửa bậy' }));
  });

  it('chủ thư mục không tự bỏ ẩn câu hỏi', async () => {
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'folders/priv/questions/q1'), { hidden: true }));
    await assertFails(updateDoc(doc(as('alice', 'a@x.com'), 'folders/priv/questions/q1'), { hidden: false }));
  });

  it('ẩn thư mục buộc riêng tư; chủ không công khai lại được', async () => {
    await assertFails(updateDoc(doc(mod(), 'folders/pub'), { hidden: true })); // còn công khai → bị chặn
    await assertSucceeds(updateDoc(doc(mod(), 'folders/pub'), { hidden: true, visibility: 'private' }));
    await assertFails(updateDoc(doc(as('alice', 'a@x.com'), 'folders/pub'), { visibility: 'public' }));
  });

  it('không xóa thư mục, không đánh dấu nổi bật, không tự cấp quyền', async () => {
    await assertFails(deleteDoc(doc(mod(), 'folders/pub')));
    await assertFails(updateDoc(doc(mod(), 'folders/pub'), { featured: true }));
    await assertFails(setDoc(doc(as('eve', 'e@x.com'), 'moderators/eve'), { email: 'e@x.com' }));
  });
});
