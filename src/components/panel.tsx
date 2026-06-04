import { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_22px_50px_rgba(148,163,184,0.16)] backdrop-blur-sm ${className}`}
    >
      {children}
    </section>
  );
}
