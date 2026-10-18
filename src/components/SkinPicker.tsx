import { skinsWithNames, type Skin, type SkinNames } from '../lib/skins';
import { IconCheck } from '../icons';

/** Hình xem trước 1 theme: thanh menu, chú cú, nút chính và thẻ theo màu của theme. */
function SkinPreview({ skin }: { skin: Skin }) {
  const [main, light, owl] = skin.swatch;
  return (
    <svg viewBox="0 0 120 72" className="h-auto w-full rounded-xl" aria-hidden="true">
      <rect width="120" height="72" fill="#FFF9F2" />
      <circle cx="10" cy="4" r="22" fill={light} />
      <circle cx="116" cy="70" r="20" fill={light} opacity="0.8" />
      <rect x="0" y="0" width="120" height="12" fill="#fff" opacity="0.85" />
      <circle cx="8" cy="6" r="3.5" fill={owl} />
      <rect x="14" y="4.5" width="18" height="3" rx="1.5" fill="#3B3355" opacity="0.7" />
      <rect x="86" y="3" width="14" height="6" rx="3" fill={light} />
      <rect x="102" y="3" width="12" height="6" rx="3" fill="#EFEBF5" />
      <rect x="8" y="18" width="104" height="46" rx="6" fill="#fff" stroke="#EFEBF5" />
      <rect x="14" y="25" width="44" height="4" rx="2" fill="#3B3355" opacity="0.75" />
      <rect x="14" y="32" width="34" height="4" rx="2" fill={main} />
      <rect x="14" y="40" width="50" height="2.5" rx="1.25" fill="#C9C3D9" />
      <rect x="14" y="51" width="26" height="8" rx="4" fill={main} />
      <rect x="44" y="51" width="22" height="8" rx="4" fill="#fff" stroke="#E4E0EE" />
      {/* chú cú */}
      <ellipse cx="94" cy="47" rx="13" ry="12" fill={owl} />
      <ellipse cx="94" cy="51" rx="7.5" ry="7" fill={light} />
      <circle cx="89" cy="43" r="4.5" fill="#fff" />
      <circle cx="99" cy="43" r="4.5" fill="#fff" />
      <circle cx="89" cy="43.5" r="2" fill="#3B3355" />
      <circle cx="99" cy="43.5" r="2" fill="#3B3355" />
      <path d="M92.5 47 L94 49.5 L95.5 47 Z" fill="#FFB59A" />
      <path d="M82 36 L94 31 L106 36 L94 41 Z" fill="#4A4168" />
    </svg>
  );
}

/**
 * Chọn theme. `defaultLabel` (tùy chọn) thêm lựa chọn "Theo mặc định" cho người dùng;
 * value = null nghĩa là đang theo mặc định.
 */
export default function SkinPicker({
  value,
  onChange,
  defaultSkin,
  names,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  defaultSkin?: Skin;
  /** Tên tùy chỉnh do admin đặt. */
  names?: SkinNames;
}) {
  const options: { id: string | null; skin: Skin; title: string; sub: string }[] = [
    ...(defaultSkin ? [{ id: null, skin: defaultSkin, title: 'Theo mặc định', sub: `Hiện là: ${defaultSkin.name}` }] : []),
    ...skinsWithNames(names).map((s) => ({ id: s.id, skin: s, title: s.name, sub: s.tagline })),
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id ?? 'default'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className={`relative flex flex-col gap-2 rounded-2xl border-2 p-2.5 text-left transition ${
              active ? 'border-lilac-500 bg-lilac-100/50' : 'border-ink/10 bg-surface hover:border-lilac-300'
            }`}
          >
            {active && (
              <span className="absolute right-3.5 top-3.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-lilac-500 text-white shadow">
                <IconCheck size={14} strokeWidth={3} />
              </span>
            )}
            <SkinPreview skin={o.skin} />
            <div className="px-1 pb-0.5">
              <div className="flex items-center gap-1.5 font-extrabold">
                <span className="h-3 w-3 rounded-full" style={{ background: o.skin.swatch[0] }} />
                {o.title}
              </div>
              <div className="text-xs font-semibold text-ink/50">{o.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
