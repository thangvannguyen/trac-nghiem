import type { ReactNode } from 'react';
import {
  doc,
} from 'firebase/firestore';
import { setDoc } from '../lib/fs'; // có đếm quota ước tính
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { useSite } from '../lib/site';
import { setDailyGoal, useUserDoc } from '../lib/stats';
import type { StudyLayout } from '../lib/admin';
import Switch from '../components/Switch';
import LoginButton, { LoginPrompt } from '../components/LoginButton';
import { useToast } from '../components/Toast';
import { IconCard, IconMonitor, IconMoon, IconPage, IconSettings, IconSun, IconVolume } from '../icons';
import { saveSkin, saveTheme } from '../lib/theme';
import { skinById } from '../lib/skins';
import SkinPicker from '../components/SkinPicker';

/* Cài đặt cá nhân – lưu trên database theo tài khoản (users/{uid}), dùng cho mọi thư mục. */

const save = (uid: string, patch: Record<string, unknown>) => setDoc(doc(db, 'users', uid), patch, { merge: true });

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-3 p-5">
      <div>
        <h2 className="font-black">{title}</h2>
        {hint && <p className="text-sm text-ink/55">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Hình minh họa nhỏ cho 2 cách làm bài. */
function LayoutThumb({ k }: { k: StudyLayout }) {
  return (
    <svg width="84" height="58" viewBox="0 0 84 58" aria-hidden="true">
      <rect x="1" y="1" width="82" height="56" rx="7" fill="#fff" stroke="#E4E0EE" />
      {k === 'one' ? (
        <>
          <rect x="16" y="8" width="52" height="5" rx="2.5" fill="#C5AEFF" />
          {[18, 27, 36].map((y) => (
            <rect key={y} x="16" y={y} width="52" height="6" rx="3" fill="#EEE6FF" stroke="#C5AEFF" />
          ))}
          <rect x="50" y="46" width="18" height="6" rx="3" fill="#8C6CF0" />
        </>
      ) : (
        <>
          <rect x="6" y="7" width="20" height="44" rx="4" fill="#F5F2FB" stroke="#E4E0EE" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={9 + (i % 2) * 8} y={11 + Math.floor(i / 2) * 7} width="6" height="5" rx="1.5" fill={i < 3 ? '#8C6CF0' : '#E4E0EE'} />
          ))}
          {[7, 30].map((y) => (
            <g key={y}>
              <rect x="31" y={y} width="44" height="3.5" rx="1.75" fill="#C5AEFF" />
              {[0, 1, 2].map((r) => (
                <rect key={r} x="31" y={y + 6 + r * 5.5} width="40" height="4" rx="2" fill="#EEE6FF" stroke="#C5AEFF" strokeWidth="0.6" />
              ))}
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

function StyleThumb({ k }: { k: 'cards' | 'paper' }) {
  // plain = dòng chữ trơn (Gộp trang); ngược lại = đáp án dạng ô (Từng thẻ).
  const question = (y: number, plain = false) => (
    <g key={y}>
      <rect x="8" y={y} width="30" height="2.5" rx="1.25" fill="#C5AEFF" />
      {[0, 1, 2].map((r) =>
        plain ? (
          <g key={r}>
            <circle cx="10" cy={y + 6 + r * 4} r="1.3" fill="#9A93AE" />
            <rect x="13" y={y + 5.2 + r * 4} width={22 - r * 4} height="1.6" rx="0.8" fill="#C9C3D9" />
          </g>
        ) : (
          <rect key={r} x="8" y={y + 4.5 + r * 4} width="46" height="3" rx="1.5" fill="#EEE6FF" stroke="#C5AEFF" strokeWidth="0.5" />
        ),
      )}
    </g>
  );
  return (
    <svg width="64" height="48" viewBox="0 0 64 48" aria-hidden="true" className="shrink-0">
      {k === 'cards' ? (
        <>
          <rect x="3" y="1.5" width="58" height="21" rx="4" fill="#fff" stroke="#E4E0EE" />
          <rect x="3" y="25.5" width="58" height="21" rx="4" fill="#fff" stroke="#E4E0EE" />
          {question(4.5)}
          {question(28.5)}
        </>
      ) : (
        <>
          <rect x="3" y="1.5" width="58" height="45" rx="4" fill="#fff" stroke="#E4E0EE" />
          <path d="M3 6.5 a4 4 0 0 1 4 -5 h50 a4 4 0 0 1 4 5 Z" fill="#EEE6FF" />
          {question(9, true)}
          <path d="M3 27 H61" stroke="#E4E0EE" />
          {question(30, true)}
        </>
      )}
    </svg>
  );
}

export default function Settings() {
  const { user, uid, loading } = useAuth();
  const { config } = useSite();
  const me = useUserDoc(uid);
  const toast = useToast();

  if (loading || me.loading) return <div className="card mx-auto h-64 max-w-2xl animate-pulse bg-surface/60" />;
  if (!uid) return <LoginPrompt message="Đăng nhập để lưu cài đặt học tập của bạn." />;

  const layout = me.data.studyLayout;
  const goal = me.data.dailyGoal ?? config.defaultDailyGoal;
  const run = (p: Promise<unknown>) => p.then(() => toast('Đã lưu cài đặt'), () => toast('Không lưu được', 'error'));

  const LAYOUTS: { k: StudyLayout | undefined; label: string; hint: string }[] = [
    { k: undefined, label: 'Theo mặc định', hint: `Hiện là: ${config.defaultStudyLayout === 'all' ? 'Cả bài' : 'Từng câu'}` },
    { k: 'one', label: 'Từng câu', hint: 'Mỗi lần 1 câu, bấm để sang câu tiếp' },
    { k: 'all', label: 'Cả bài', hint: 'Hiện tất cả câu trên 1 trang như thi giấy' },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac-100 text-lilac-500">
          <IconSettings size={26} />
        </span>
        <div>
          <h1 className="text-2xl font-black">Cài đặt</h1>
          <p className="text-sm font-semibold text-ink/55">Áp dụng cho mọi thư mục, lưu theo tài khoản của bạn.</p>
        </div>
      </div>

      {!user && (
        <div className="card flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm font-semibold text-ink/65">
            Bạn đang dùng chế độ <b>khách</b>: cài đặt chỉ gắn với trình duyệt này. Đăng nhập để dùng trên mọi thiết bị.
          </p>
          <LoginButton />
        </div>
      )}

      <Section title="Giao diện" hint="Chế độ tối dễ chịu hơn khi học buổi tối.">
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['light', 'Sáng', IconSun],
              ['dark', 'Tối', IconMoon],
              ['system', 'Theo hệ thống', IconMonitor],
            ] as const
          ).map(([k, label, Icon]) => {
            const active = (me.data.theme ?? 'system') === k;
            return (
              <button
                key={k}
                aria-pressed={active}
                onClick={() => run(saveTheme(uid, k))}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
                  active ? 'border-lilac-500 bg-lilac-100/60' : 'border-ink/10 bg-surface hover:border-lilac-300'
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? 'bg-lilac-500 text-white' : 'bg-ink/5 text-ink/60'}`}>
                  <Icon size={22} />
                </span>
                <span className="text-sm font-extrabold">{label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {config.allowUserSkin ? (
        <Section title="Theme" hint="Chọn màu sắc bạn thích để học đỡ chán – áp dụng cho toàn web.">
          <SkinPicker value={me.data.skin ?? null} names={config.skinNames} defaultSkin={skinById(config.defaultSkin, config.skinNames)} onChange={(id) => run(saveSkin(uid, id))} />
        </Section>
      ) : (
        <p className="px-1 text-sm font-semibold text-ink/50">
          Theme đang dùng: <b className="text-ink">{skinById(config.defaultSkin, config.skinNames).name}</b> (do admin chọn cho cả web).
        </p>
      )}

      <Section title="Cách làm bài" hint="Dùng cho chế độ Học, Kiểm tra và Ôn câu sai.">
        <div className="grid gap-2 sm:grid-cols-3">
          {LAYOUTS.map((o) => {
            const active = layout === o.k;
            return (
              <button
                key={o.label}
                aria-pressed={active}
                onClick={() => run(save(uid, { studyLayout: o.k ?? null }))}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
                  active ? 'border-lilac-500 bg-lilac-100/60' : 'border-ink/10 bg-surface hover:border-lilac-300'
                }`}
              >
                {o.k ? (
                  <LayoutThumb k={o.k} />
                ) : (
                  <span className="flex h-[58px] items-center gap-1 text-ink/40">
                    <IconCard size={26} /> / <IconPage size={26} />
                  </span>
                )}
                <span className="font-extrabold">{o.label}</span>
                <span className="text-xs font-semibold text-ink/50">{o.hint}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Kiểu hiển thị khi làm cả bài" hint="Chỉ áp dụng khi chọn cách làm “Cả bài”. Cũng đổi nhanh được ngay trong khung Bài làm.">
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ['cards', 'Từng thẻ', 'Mỗi câu là một thẻ riêng'],
              ['paper', 'Gộp 1 trang', 'Tất cả câu trong một khung, đáp án dạng chữ từng dòng như bản in'],
            ] as const
          ).map(([k, label, hint]) => {
            const active = (me.data.sheetStyle ?? 'cards') === k;
            return (
              <button
                key={k}
                aria-pressed={active}
                onClick={() => run(save(uid, { sheetStyle: k }))}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                  active ? 'border-lilac-500 bg-lilac-100/60' : 'border-ink/10 bg-surface hover:border-lilac-300'
                }`}
              >
                <StyleThumb k={k} />
                <span>
                  <span className="block font-extrabold">{label}</span>
                  <span className="block text-xs font-semibold text-ink/50">{hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Mục tiêu mỗi ngày" hint="Số câu muốn làm mỗi ngày – hiện ở trang Thống kê.">
        <div className="flex flex-wrap gap-2">
          {[10, 20, 30, 50, 100].map((g) => (
            <button
              key={g}
              aria-pressed={goal === g}
              onClick={() => run(setDailyGoal(uid, g))}
              className={`chip border-2 px-4 py-2 text-sm ${goal === g ? 'border-lilac-500 bg-lilac-100 text-ink' : 'border-ink/10 bg-surface text-ink/60'}`}
            >
              {g} câu
            </button>
          ))}
        </div>
      </Section>

      <Section title="Thông báo">
        <div className="flex items-center gap-3">
          <IconVolume size={20} className="shrink-0 text-ink/50" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold">Âm thanh khi có thông báo mới</div>
            <div className="text-xs text-ink/50">Tiếng chuông nhỏ khi thông báo của admin hiện lên.</div>
          </div>
          <Switch on={!me.data.muteNotice} onChange={(v) => run(save(uid, { muteNotice: !v }))} label="Âm thanh thông báo" />
        </div>
      </Section>
    </div>
  );
}
