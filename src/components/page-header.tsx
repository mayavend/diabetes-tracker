type PageHeaderProps = {
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function PageHeader({ eyebrow, subtitle, title }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/75">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
