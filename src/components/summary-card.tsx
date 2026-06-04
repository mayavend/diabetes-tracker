type SummaryCardProps = {
  label: string;
  value: string;
};

export function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="group rounded-[24px] border border-sky-100/80 bg-gradient-to-br from-white via-sky-50/60 to-cyan-50/80 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(56,189,248,0.18)]">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 shadow-inner shadow-sky-100">
        <div className="h-3 w-3 rounded-full bg-gradient-to-br from-sky-400 to-blue-500" />
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}
