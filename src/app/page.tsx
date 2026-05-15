import { SummaryCard } from "@/components/summary-card";
import { dashboardSummary } from "@/lib/mock-data";

export default function Home() {
  return (
    <div>
      <h2 className="mb-5 text-2xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {dashboardSummary.map((item) => (
          <SummaryCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}
