import type { Timestamp } from 'firebase/firestore';

export type Visibility = 'private' | 'link' | 'public';

export interface Folder {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto: string;
  name: string;
  description: string;
  color: FolderColor;
  icon: FolderIconName;
  visibility: Visibility;
  /** false = ẩn tên & ảnh người chia sẻ (mặc định hiện). */
  showOwner?: boolean;
  /** Admin đánh dấu nổi bật – hiện đầu trang Khám phá. */
  featured?: boolean;
  /** Bị kiểm duyệt ẩn (luôn ở chế độ riêng tư). */
  hidden?: boolean;
  hiddenReason?: string;
  /** Mã băm email người được mời (xem emailKey.ts); email thật nằm ở folders/{id}/private/sharing. */
  viewerKeys: string[];
  editorKeys: string[];
  questionCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctIds: string[];
  note: string;
  order: number;
  /** Bị kiểm duyệt ẩn khỏi người học. */
  hidden?: boolean;
  hiddenReason?: string;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface QuestionStat {
  right: number;
  wrong: number;
  lastAt: number;
}

export type ProgressStats = Record<string, QuestionStat>;

export const FOLDER_COLORS = ['peach', 'mint', 'sky', 'lilac', 'lemon', 'rose'] as const;
export type FolderColor = (typeof FOLDER_COLORS)[number];

export const FOLDER_ICONS = [
  // Học tập chung
  'book', 'pencil', 'bulb', 'star', 'trophy', 'puzzle', 'calc', 'chat', 'scroll', 'scale', 'coin', 'code', 'globe', 'rocket',
  // Y học / sức khỏe
  'pill', 'herb', 'leaf', 'needle', 'yinyang', 'tea', 'stetho', 'heart', 'brain', 'tooth', 'bone', 'eye', 'dna', 'flask', 'atom',
  // Y học hiện đại
  'syringe', 'microscope', 'lungs', 'kidney', 'stomach', 'liver', 'bandage', 'thermometer', 'blood', 'virus', 'ambulance', 'baby',
  // Y học cổ truyền
  'ginseng', 'gourd', 'lotus', 'bagua', 'wuxing', 'moxa', 'cupping', 'pulse', 'meridian', 'cabinet',
  'steelyard', 'potsac', 'lingzhi', 'cinnamon', 'ginger', 'chrysanthemum', 'goji', 'bamboo', 'classic', 'tongue',
  'jujube', 'licorice', 'acupoint',
  // Học tập (thêm)
  'gradcap', 'clock', 'calendar', 'notebook', 'backpack', 'flag', 'magnifier', 'chartbar', 'coffee',
  // Sở thích / khác
  'music', 'palette', 'camera', 'ball', 'plant', 'cat', 'sun', 'moon',
  'headphones', 'gamepad', 'dog', 'bear', 'flower', 'rainbow',
] as const;
export type FolderIconName = (typeof FOLDER_ICONS)[number];

export type Role = 'owner' | 'editor' | 'viewer' | 'guest';
