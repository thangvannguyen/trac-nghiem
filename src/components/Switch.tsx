export default function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? 'bg-mint-500' : 'bg-ink/15'}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
    </button>
  );
}
