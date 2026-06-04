"use client";

// Small chat-style wrapper for the rule-based glucose Q&A engine.
// It keeps the UI conversation state local while routing questions through the
// shared entry history and deterministic response logic.
import { FormEvent, useState } from "react";
import { answerGlucoseQuestion } from "@/lib/glucose-qa";
import { useClientEntries } from "@/lib/use-client-entries";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const SUGGESTED_QUESTIONS = [
  "Why did my glucose spike today?",
  "What patterns are affecting my glucose?",
  "Are after-meal readings higher than fasting readings?",
  "What should I pay attention to this week?",
];

type GlucoseQAPanelProps = {
  className?: string;
};

export function GlucoseQAPanel({ className = "" }: GlucoseQAPanelProps) {
  const { entries, isClientReady } = useClientEntries();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      text: "Ask about your recent glucose patterns, spikes, meal-related readings, or what to focus on this week.",
    },
  ]);

  function submitQuestion(nextQuestion: string) {
    const trimmedQuestion = nextQuestion.trim();
    if (!trimmedQuestion || !isClientReady) return;

    // Responses are generated entirely from the saved local entry history.
    const response = answerGlucoseQuestion(trimmedQuestion, entries);

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        text: trimmedQuestion,
      },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: response,
      },
    ]);
    setQuestion("");
  }

  function handleQuestionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuestion(question);
  }

  return (
    <section className={className}>
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700/70">
        Assistant
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
        Glucose Q&amp;A
      </h2>
      <p className="mt-3 text-base text-slate-600">
        Ask simple questions about your saved entries and recent patterns.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => submitQuestion(suggestion)}
            disabled={!isClientReady}
            className="rounded-full border border-sky-100 bg-sky-50/80 px-4 py-2 text-sm font-medium text-sky-800 transition-colors duration-200 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3 rounded-[26px] border border-sky-100 bg-sky-50/50 p-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "ml-auto max-w-[88%] rounded-[22px] bg-gradient-to-r from-sky-500 to-blue-500 px-4 py-3 text-sm leading-6 text-white shadow-[0_16px_32px_rgba(14,165,233,0.22)]"
                : "max-w-[88%] rounded-[22px] bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_14px_30px_rgba(148,163,184,0.14)]"
            }
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleQuestionSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about spikes, patterns, or this week..."
          className="flex-1 rounded-2xl border border-sky-100 bg-sky-50/50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
        <button
          type="submit"
          disabled={!isClientReady || question.trim().length === 0}
          className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(14,165,233,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
