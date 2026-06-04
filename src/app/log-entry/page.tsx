"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Entry, READING_TYPES } from "@/lib/entries";
import { useClientEntries } from "@/lib/use-client-entries";

type FormState = {
  timestamp: string;
  readingType: Entry["readingType"];
  glucose: string;
  mealNote: string;
  exerciseNote: string;
  sleepHours: string;
  medication: string;
  notes: string;
};

const initialFormState: FormState = {
  timestamp: "",
  readingType: "",
  glucose: "",
  mealNote: "",
  exerciseNote: "",
  sleepHours: "",
  medication: "",
  notes: "",
};

function getCurrentTimestampInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - offset * 60 * 1000);
  return localTime.toISOString().slice(0, 16);
}

function createFormStateFromEntry(entry: Entry): FormState {
  return {
    timestamp: entry.timestamp
      ? getCurrentTimestampInputValueFromStored(entry.timestamp)
      : getCurrentTimestampInputValue(),
    readingType: entry.readingType,
    glucose: entry.glucose?.toString() ?? "",
    mealNote: entry.mealNote,
    exerciseNote: entry.exerciseNote,
    sleepHours: entry.sleepHours?.toString() ?? "",
    medication: entry.medication,
    notes: entry.notes,
  };
}

function getCurrentTimestampInputValueFromStored(timestamp: string) {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset();
  const localTime = new Date(date.getTime() - offset * 60 * 1000);
  return localTime.toISOString().slice(0, 16);
}

export default function LogEntryPage() {
  const router = useRouter();
  const { addEntry, cancelEditingEntry, editingEntry, updateEntry } =
    useClientEntries();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [successMessage, setSuccessMessage] = useState("");
  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setForm(
        editingEntry
          ? createFormStateFromEntry(editingEntry)
          : {
              ...initialFormState,
              timestamp: getCurrentTimestampInputValue(),
            },
      );
      setIsClientReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [editingEntry]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const entry: Entry = {
      id: editingEntry?.id ?? crypto.randomUUID(),
      createdAt: editingEntry?.createdAt ?? new Date().toISOString(),
      timestamp: form.timestamp
        ? new Date(form.timestamp).toISOString()
        : new Date().toISOString(),
      readingType: form.readingType,
      glucose: form.glucose ? Number(form.glucose) : null,
      mealNote: form.mealNote.trim(),
      exerciseNote: form.exerciseNote.trim(),
      sleepHours: form.sleepHours ? Number(form.sleepHours) : null,
      medication: form.medication.trim(),
      notes: form.notes.trim(),
    };

    if (editingEntry) {
      updateEntry(entry);
      setSuccessMessage("Entry updated successfully.");
      router.push("/dashboard");
    } else {
      addEntry(entry);
      setSuccessMessage("Entry saved successfully.");
    }

    setForm({
      ...initialFormState,
      timestamp: getCurrentTimestampInputValue(),
    });
    cancelEditingEntry();
  }

  function handleCancelEdit() {
    cancelEditingEntry();
    setForm({
      ...initialFormState,
      timestamp: getCurrentTimestampInputValue(),
    });
    setSuccessMessage("");
  }

  return (
    <div className="pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <PageHeader
            eyebrow={editingEntry ? "Editing" : "Daily Logging"}
            title={editingEntry ? "Editing Entry" : "Log today's entry"}
            subtitle={
              editingEntry
                ? "Update the details below and save your changes with the same entry record."
                : "Capture glucose, meals, sleep, exercise, and context in one calm, easy flow."
            }
          />
        </div>
        {editingEntry ? (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="mt-2 rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-sm font-medium text-sky-800 transition-colors duration-200 hover:bg-sky-50"
          >
            Cancel Edit
          </button>
        ) : null}
      </div>

      <Panel>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Date & Time</span>
              <input
                type="datetime-local"
                value={form.timestamp}
                onChange={(event) => {
                  setSuccessMessage("");
                  setForm((current) => ({ ...current, timestamp: event.target.value }));
                }}
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              {!isClientReady ? (
                <span className="text-xs text-slate-500">Loading current time...</span>
              ) : null}
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Reading Type</span>
              <select
                value={form.readingType}
                onChange={(event) => {
                  setSuccessMessage("");
                  setForm((current) => ({
                    ...current,
                    readingType: event.target.value as Entry["readingType"],
                  }));
                }}
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
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

          <div className="grid gap-5 lg:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Glucose (mg/dL)</span>
              <input
                type="number"
                placeholder="e.g. 108"
                value={form.glucose}
                onChange={(event) => {
                  setSuccessMessage("");
                  setForm((current) => ({ ...current, glucose: event.target.value }));
                }}
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">Sleep Hours</span>
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 7.5"
                value={form.sleepHours}
                onChange={(event) => {
                  setSuccessMessage("");
                  setForm((current) => ({
                    ...current,
                    sleepHours: event.target.value,
                  }));
                }}
                className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Meal Note</span>
            <input
              type="text"
              placeholder="What did you eat?"
              value={form.mealNote}
              onChange={(event) => {
                setSuccessMessage("");
                setForm((current) => ({ ...current, mealNote: event.target.value }));
              }}
              className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Exercise Note</span>
            <input
              type="text"
              placeholder="Any activity today?"
              value={form.exerciseNote}
              onChange={(event) => {
                setSuccessMessage("");
                setForm((current) => ({ ...current, exerciseNote: event.target.value }));
              }}
              className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Medication</span>
            <input
              type="text"
              placeholder="Medication and dose"
              value={form.medication}
              onChange={(event) => {
                setSuccessMessage("");
                setForm((current) => ({ ...current, medication: event.target.value }));
              }}
              className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">Notes</span>
            <textarea
              rows={5}
              placeholder="Anything else to track?"
              value={form.notes}
              onChange={(event) => {
                setSuccessMessage("");
                setForm((current) => ({ ...current, notes: event.target.value }));
              }}
              className="rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </label>

          {successMessage ? (
            <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={!isClientReady}
              className="rounded-full bg-sky-500 px-6 py-3.5 text-base font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingEntry ? "Save Changes" : "Save Entry"}
            </button>
            {!editingEntry ? (
              <p className="self-center text-sm text-slate-500">
                Small daily logs create clearer trend stories over time.
              </p>
            ) : null}
          </div>
        </form>
      </Panel>
    </div>
  );
}
