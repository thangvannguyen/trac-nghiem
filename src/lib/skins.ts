/* Danh sách theme (skin). Màu cụ thể nằm trong src/index.css theo [data-skin='…']. */

export type SkinId = 'owl' | 'herbal' | 'chill' | 'medic' | 'yhct' | 'party';

export interface Skin {
  id: SkinId;
  name: string;
  tagline: string;
  /** Màu xem trước: chủ đạo, nền nhạt, cú. */
  swatch: [string, string, string];
  /** Màu chú cú của theme (thân, cánh, bụng) – khớp với --owl-* trong index.css. */
  owl: [string, string, string];
}

export const SKINS: Skin[] = [
  { id: 'owl', name: 'Cú Học Bài', tagline: 'Tím pastel dịu mắt – theme gốc', swatch: ['#8C6CF0', '#EEE6FF', '#C5AEFF'], owl: ['#C5AEFF', '#AE90FA', '#EEE6FF'] },
  { id: 'herbal', name: 'Cú Học Dược', tagline: 'Xanh lá thảo dược, tươi mát như vườn thuốc', swatch: ['#2FA36B', '#DDF3E6', '#9ED9B5'], owl: ['#9ED9B5', '#7CC79C', '#E6F7EC'] },
  { id: 'chill', name: 'Cú Chill', tagline: 'Cam san hô hoàng hôn, học nhẹ nhàng thư giãn', swatch: ['#EC6A54', '#FFE6E0', '#FFB59A'], owl: ['#FFB59A', '#F59A80', '#FFE8DC'] },
  { id: 'medic', name: 'Cú Học Y', tagline: 'Xanh dương y khoa, sạch sẽ như phòng khám', swatch: ['#2B7BD6', '#DFECFC', '#A9CCF5'], owl: ['#A9CCF5', '#86B6EE', '#E3EFFD'] },
  { id: 'yhct', name: 'Cú YHCT', tagline: 'Đỏ son trầm, vàng giấy cổ – đậm chất Đông y', swatch: ['#B4473A', '#FFF6CC', '#E2BD8F'], owl: ['#E2BD8F', '#C99A6A', '#F7E8D3'] },
  { id: 'party', name: 'Cú Quẩy', tagline: 'Hồng neon sôi động, học mà như đi quẩy', swatch: ['#E3398F', '#FFE0F0', '#FF9ACB'], owl: ['#FF9ACB', '#F57AB6', '#FFE3F1'] },
];

/** Tên tùy chỉnh do admin đặt (config/app.skinNames); để trống thì dùng tên gốc. */
export type SkinNames = Partial<Record<SkinId, string>>;

export const withName = (s: Skin, names?: SkinNames): Skin => ({ ...s, name: names?.[s.id]?.trim() || s.name });

export const skinById = (id: string | undefined, names?: SkinNames) => withName(SKINS.find((s) => s.id === id) ?? SKINS[0], names);

export const skinsWithNames = (names?: SkinNames) => SKINS.map((s) => withName(s, names));

/* ---------------- Kiểu chú cú (logo) – tách riêng khỏi màu theme ---------------- */

export type MascotId = 'grad' | 'herbal' | 'chill' | 'medic' | 'yhct' | 'party' | 'nerd' | 'sleepy' | 'king' | 'music';

export const MASCOTS: { id: MascotId; label: string }[] = [
  { id: 'grad', label: 'Mũ tốt nghiệp' },
  { id: 'herbal', label: 'Vòng lá thảo dược' },
  { id: 'chill', label: 'Kính râm & hoa' },
  { id: 'medic', label: 'Gương soi & ống nghe' },
  { id: 'yhct', label: 'Khăn xếp thầy lang' },
  { id: 'party', label: 'Mũ tiệc quẩy' },
  { id: 'nerd', label: 'Mọt sách' },
  { id: 'sleepy', label: 'Ngủ gật ôn đêm' },
  { id: 'king', label: 'Vương miện thủ khoa' },
  { id: 'music', label: 'Tai nghe nhạc' },
];

/** Kiểu cú mặc định của từng theme (admin có thể đổi trong config/app.skinMascots). */
export const DEFAULT_MASCOT: Record<SkinId, MascotId> = {
  owl: 'grad',
  herbal: 'herbal',
  chill: 'chill',
  medic: 'medic',
  yhct: 'yhct',
  party: 'party',
};

export type SkinMascots = Partial<Record<SkinId, MascotId>>;

export const mascotFor = (skin: string, map?: SkinMascots): MascotId =>
  (map?.[skin as SkinId] && MASCOTS.some((m) => m.id === map[skin as SkinId]) ? map[skin as SkinId] : DEFAULT_MASCOT[skin as SkinId]) ?? 'grad';
