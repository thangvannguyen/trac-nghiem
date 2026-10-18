/**
 * Mã băm của email (SHA-256, dạng hex CHỮ HOA – khớp với hashing.sha256(...).toHexString() trong firestore.rules).
 * Thư mục chỉ lưu mã băm của email người được mời, nên người xem thư mục không đọc được email thật.
 */
export async function emailKey(email: string): Promise<string> {
  const e = email.trim().toLowerCase();
  if (!e) return '';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(e));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}
