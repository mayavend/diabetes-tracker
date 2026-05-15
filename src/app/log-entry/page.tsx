export default function LogEntryPage() {
  return (
    <div>
      <h2 className="mb-5 text-2xl font-semibold">Log Entry</h2>

      <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Glucose (mg/dL)</span>
            <input
              type="number"
              placeholder="e.g. 108"
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Sleep Hours</span>
            <input
              type="number"
              step="0.5"
              placeholder="e.g. 7.5"
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Meal Note</span>
          <input
            type="text"
            placeholder="What did you eat?"
            className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Exercise Note</span>
          <input
            type="text"
            placeholder="Any activity today?"
            className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Medication</span>
          <input
            type="text"
            placeholder="Medication and dose"
            className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Notes</span>
          <textarea
            rows={4}
            placeholder="Anything else to track?"
            className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
          />
        </label>

        <button
          type="button"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Save Entry
        </button>
      </form>
    </div>
  );
}
