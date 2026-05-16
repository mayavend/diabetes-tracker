"use client";

import { FormEvent, useState } from "react";
import { Entry, saveEntry } from "@/lib/entries";

type FormState = {
  glucose: string;
  mealNote: string;
  exerciseNote: string;
  sleepHours: string;
  medication: string;
  notes: string;
};

const initialFormState: FormState = {
  glucose: "",
  mealNote: "",
  exerciseNote: "",
  sleepHours: "",
  medication: "",
  notes: "",
};

export default function LogEntryPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [successMessage, setSuccessMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const entry: Entry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      glucose: form.glucose ? Number(form.glucose) : null,
      mealNote: form.mealNote.trim(),
      exerciseNote: form.exerciseNote.trim(),
      sleepHours: form.sleepHours ? Number(form.sleepHours) : null,
      medication: form.medication.trim(),
      notes: form.notes.trim(),
    };

    saveEntry(entry);
    setForm(initialFormState);
    setSuccessMessage("Entry saved successfully.");
  }

  return (
    <div>
      <h2 className="mb-5 text-2xl font-semibold">Log Entry</h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
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
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Save Entry
        </button>
      </form>
    </div>
  );
}
