/*
 * Gửi thông báo đẩy (Web Push qua Firebase Cloud Messaging) khi admin đăng / hiện lại / gửi lại thông báo.
 * Kích hoạt khi trường announcements/{id}.pushRequestedAt thay đổi.
 * Kết quả ghi vào announcements/{id}.pushStatus để trang Admin hiển thị.
 */
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

const SITE_URL = 'https://trac-nghiem-4804e.web.app';
const DEAD_TOKEN = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/** Token của những thiết bị thuộc đối tượng nhận thông báo. */
async function tokensFor(n) {
  const col = db.collection('pushTokens');
  if (n.audience === 'specific') {
    const uids = Array.isArray(n.targetUids) ? n.targetUids : [];
    const out = [];
    for (let i = 0; i < uids.length; i += 30) {
      const snap = await col.where('uid', 'in', uids.slice(i, i + 30)).get();
      out.push(...snap.docs.map((d) => d.id));
    }
    return out;
  }
  const q = n.audience === 'users' ? col.where('guest', '==', false) : n.audience === 'guests' ? col.where('guest', '==', true) : col;
  return (await q.get()).docs.map((d) => d.id);
}

exports.sendNoticePush = onDocumentWritten({ document: 'announcements/{id}', region: 'asia-southeast1' }, async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!after) return;
  const req = after.pushRequestedAt;
  if (!req || (before?.pushRequestedAt && before.pushRequestedAt.isEqual(req))) return; // không có yêu cầu gửi mới

  const ref = event.data.after.ref;
  if (!after.push || !after.active) {
    await ref.update({ pushStatus: { state: 'error', error: 'Thông báo đang tắt', at: FieldValue.serverTimestamp() } });
    return;
  }

  try {
    const tokens = await tokensFor(after);
    const link = typeof after.link === 'string' && after.link.startsWith('https://') ? after.link : SITE_URL;
    const title = (after.title || '').trim() || 'Thông báo từ Cú Học Bài';
    const body = String(after.text || '').slice(0, 180);

    let sent = 0;
    let failed = 0;
    const dead = [];
    for (let i = 0; i < tokens.length; i += 500) {
      const chunk = tokens.slice(i, i + 500);
      const res = await getMessaging().sendEachForMulticast({
        tokens: chunk,
        data: { noticeId: event.params.id },
        webpush: {
          notification: {
            title,
            body,
            icon: `${link}/icon-192.png`,
            badge: `${link}/icon-192.png`,
            tag: event.params.id,
            renotify: true,
          },
          fcmOptions: { link },
        },
      });
      sent += res.successCount;
      failed += res.failureCount;
      res.responses.forEach((r, j) => {
        if (!r.success && DEAD_TOKEN.has(r.error?.code)) dead.push(chunk[j]);
      });
    }

    // Dọn token của thiết bị đã gỡ / hết hạn.
    for (let i = 0; i < dead.length; i += 400) {
      const batch = db.batch();
      dead.slice(i, i + 400).forEach((t) => batch.delete(db.collection('pushTokens').doc(t)));
      await batch.commit();
    }

    await ref.update({ pushStatus: { state: 'sent', sent, failed, at: FieldValue.serverTimestamp() } });
    logger.info('Đã gửi thông báo đẩy', { id: event.params.id, sent, failed, removed: dead.length });
  } catch (e) {
    logger.error(e);
    await ref.update({ pushStatus: { state: 'error', error: String(e.message || e).slice(0, 200), at: FieldValue.serverTimestamp() } });
  }
});
