"use client";

import { FormEvent, useState } from "react";
import { SummaryCard } from "@/components/summary-card";
import { computeGlucoseAnalytics, formatMetric } from "@/lib/analytics";
import { Entry, READING_TYPES } from "@/lib/entries";
import { useClientEntries } from "@/lib/use-client-entries";

type EditFormState = {
  exerciseNote: string;
  glucose: string;
  mealNote: string;
  medication: string;
  notes: string;
  readingType: Entry["readingType"];
  sleepHours: string;
  timestamp: string;
};

function formatTimestampForInput(timestamp: string) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const localTime = new Date(date.getTime() - offset * 60 * 1000);
  return localTime.toISOString().slice(0, 16);
}

function createEditFormState(entry: Entry): EditFormState {
  return {
    exerciseNote: entry.exerciseNote,
    glucose: entry.glucose?.toString() ?? "",
    mealNote: entry.mealNote,
    medication: entry.medication,
    notes: entry.notes,
    readingType: entry.readingType,
    sleepHours: entry.sleepHours?.toString() ?? "",
    timestamp: formatTimestampForInput(entry.timestamp || entry.createdAt),
  };
}

export default function Home() {
  const { deleteEntry, entries, isClientReady, updateEntry } = useClientEntries();
  const analytics = computeGlucoseAnalytics(entries);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [tableMessage, setTableMessage] = useState("");
  const activeEditingEntry = editingEntryId
    ? analytics.sortedEntries.find((entry) => entry.id === editingEntryId) ?? null
    : null;

  function startEditing(entry: Entry) {
    setEditingEntryId(entry.id);
    setEditForm(createEditFormState(entry));
    setTableMessage("");
  }

  function cancelEditing() {
    setEditingEntryId(null);
    setEditForm(null);
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingEntryId || !editForm) return;

    const originalEntry = analytics.sortedEntries.find((entry) => entry.id === editingEntryId);
    if (!originalEntry) return;

    updateEntry({
      ...originalEntry,
      timestamp: editForm.timestamp
        ? new Date(editForm.timestamp).toISOString()
        : originalEntry.timestamp,
      readingType: editForm.readingType,
      glucose: editForm.glucose ? Number(editForm.glucose) : null,
      mealNote: editForm.mealNote.trim(),
      exerciseNote: editForm.exerciseNote.trim(),
      sleepHours: editForm.sleepHours ? Number(editForm.sleepHours) : null,
      medication: editForm.medication.trim(),
      notes: editForm.notes.trim(),
    });

    setTableMessage("Entry updated.");
    cancelEditing();
  }

  function handleDelete(entryId: string) {
    const confirmed = window.confirm("Delete this entry?");
    if (!confirmed) return;

    deleteEntry(entryId);
    if (editingEntryId === entryId) {
      cancelEditing();
    }
    setTableMessage("Entry deleted.");
  }

  return (
    <div>
      <h2 className="mb-5 text-2xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Average Glucose"
          value={
            isClientReady
              ? formatMetric(analytics.averageGlucose, { suffix: " mg/dL" })
              : "Loading..."
          }
        />
        <SummaryCard
          label="7-Day Average"
          value={
            isClientReady
              ? formatMetric(analytics.last7DaysAverage, { suffix: " mg/dL" })
              : "Loading..."
          }
        />
        <SummaryCard
          label="Avg Fasting"
          value={
            isClientReady
              ? formatMetric(analytics.averageFastingGlucose, {
                  suffix: " mg/dL",
                })
              : "Loading..."
          }
        />
        <SummaryCard
          label="Elevated Readings"
          value={isClientReady ? String(analytics.elevatedCount) : "Loading..."}
        />
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Glucose Snapshot</h3>
        {isClientReady ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-slate-500">After-Meal Average</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.averageAfterMealGlucose, {
                  suffix: " mg/dL",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Glucose Range</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.glucoseRange, { suffix: " mg/dL" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Highest / Lowest</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {formatMetric(analytics.highestGlucose, { suffix: " mg/dL" })} /{" "}
                {formatMetric(analytics.lowestGlucose, { suffix: " mg/dL" })}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">7-Day Trend</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {analytics.comparisonLabel}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Previous:{" "}
                {formatMetric(analytics.previous7DaysAverage, {
                  suffix: " mg/dL",
                })}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Loading glucose insights...</p>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Insights</h3>
        {isClientReady ? (
          <div className="mt-4 space-y-3">
            {analytics.insights.map((insight) => (
              <p key={insight} className="text-sm leading-6 text-slate-700">
                {insight}
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Loading insights...</p>
        )}
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-lg font-semibold">Recent Entries</h3>
        {tableMessage ? (
          <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {tableMessage}
          </p>
        ) : null}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Glucose</th>
                <th className="px-4 py-3 font-medium">Sleep</th>
                <th className="px-4 py-3 font-medium">Meal</th>
                <th className="px-4 py-3 font-medium">Exercise</th>
                <th className="px-4 py-3 font-medium">Medication</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isClientReady ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    Loading recent entries...
                  </td>
                </tr>
              ) : analytics.sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-500">
                    No entries yet. Add your first log from the Log Entry page.
                  </td>
                </tr>
              ) : (
                analytics.sortedEntries.slice(0, 8).map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(entry.timestamp || entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.readingType || "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.glucose ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.sleepHours ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.mealNote || "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.exerciseNote || "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {entry.medication || "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => startEditing(entry)}
                          className="text-sm font-medium text-sky-700 hover:text-sky-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="text-sm font-medium text-rose-700 hover:text-rose-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {activeEditingEntry && editForm ? (
          <form
            onSubmit={handleEditSubmit}
            className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-base font-semibold">Edit Entry</h4>
              <button
                type="button"
                onClick={cancelEditing}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Date & Time</span>
                <input
                  type="datetime-local"
                  value={editForm.timestamp}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, timestamp: event.target.value }
                        : current,
                    )
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Reading Type</span>
                <select
                  value={editForm.readingType}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            readingType: event.target.value as Entry["readingType"],
                          }
                        : current,
                    )
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none ring-sky-200 focus:ring"
                >
                  <option value="">Select type</option>
                  {READING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Glucose (mg/dL)</span>
                <input
                  type="number"
                  value={editForm.glucose}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current ? { ...current, glucose: event.target.value } : current,
                    )
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Sleep Hours</span>
                <input
                  type="number"
                  step="0.5"
                  value={editForm.sleepHours}
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? { ...current, sleepHours: event.target.value }
                        : current,
                    )
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Meal Note</span>
              <input
                type="text"
                value={editForm.mealNote}
                onChange={(event) =>
                  setEditForm((current) =>
                    current ? { ...current, mealNote: event.target.value } : current,
                  )
                }
                className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Exercise Note</span>
              <input
                type="text"
                value={editForm.exerciseNote}
                onChange={(event) =>
                  setEditForm((current) =>
                    current
                      ? { ...current, exerciseNote: event.target.value }
                      : current,
                  )
                }
                className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Medication</span>
              <input
                type="text"
                value={editForm.medication}
                onChange={(event) =>
                  setEditForm((current) =>
                    current
                      ? { ...current, medication: event.target.value }
                      : current,
                  )
                }
                className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Notes</span>
              <textarea
                rows={4}
                value={editForm.notes}
                onChange={(event) =>
                  setEditForm((current) =>
                    current ? { ...current, notes: event.target.value } : current,
                  )
                }
                className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
              />
            </label>

            <button
              type="submit"
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Save Changes
            </button>
          </form>
        ) : null}
      </section>
    </div>
  );
}
