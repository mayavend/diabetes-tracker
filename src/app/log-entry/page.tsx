"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      router.push("/");
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
    <div>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            {editingEntry ? "Editing Entry" : "Log Entry"}
          </h2>
          {editingEntry ? (
            <p className="mt-1 text-sm text-slate-600">
              Update the existing entry and save changes.
            </p>
          ) : null}
        </div>
        {editingEntry ? (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel Edit
          </button>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Date & Time</span>
            <input
              type="datetime-local"
              value={form.timestamp}
              onChange={(event) => {
                setSuccessMessage("");
                setForm((current) => ({ ...current, timestamp: event.target.value }));
              }}
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
            />
            {!isClientReady ? (
              <span className="text-xs text-slate-500">Loading current time...</span>
            ) : null}
          </label>

          <label className="flex flex-col gap-1 text-sm">
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
              placeholder="e.g. 108"
              value={form.glucose}
              onChange={(event) => {
                setSuccessMessage("");
                setForm((current) => ({ ...current, glucose: event.target.value }));
              }}
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
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
              className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Meal Note</span>
          <input
            type="text"
            placeholder="What did you eat?"
            value={form.mealNote}
            onChange={(event) => {
              setSuccessMessage("");
              setForm((current) => ({ ...current, mealNote: event.target.value }));
            }}
            className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Exercise Note</span>
          <input
            type="text"
            placeholder="Any activity today?"
            value={form.exerciseNote}
            onChange={(event) => {
              setSuccessMessage("");
              setForm((current) => ({ ...current, exerciseNote: event.target.value }));
            }}
            className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Medication</span>
          <input
            type="text"
            placeholder="Medication and dose"
            value={form.medication}
            onChange={(event) => {
              setSuccessMessage("");
              setForm((current) => ({ ...current, medication: event.target.value }));
            }}
            className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Notes</span>
          <textarea
            rows={4}
            placeholder="Anything else to track?"
            value={form.notes}
            onChange={(event) => {
              setSuccessMessage("");
              setForm((current) => ({ ...current, notes: event.target.value }));
            }}
            className="rounded-md border border-slate-300 px-3 py-2 outline-none ring-sky-200 focus:ring"
          />
        </label>

        {successMessage ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!isClientReady}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          {editingEntry ? "Save Changes" : "Save Entry"}
        </button>
      </form>
    </div>
  );
}
