interface TabsProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function Tabs<T extends string>({ value, options, onChange }: TabsProps<T>) {
  return (
    <div className="neu-card-inset p-1 rounded-xl flex items-center gap-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
            value === opt.value ? 'bg-ink-strong text-white' : 'text-slate-500'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
