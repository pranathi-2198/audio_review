"use client";

import { useState } from "react";
import { saveFeedback } from "@/lib/database";
import type { Feedback, ReviewStatus } from "@/lib/types";

interface FeedbackFormProps {
  chunkId: string;
  initialFeedback: Feedback | null;
  onSaved?: (feedback: Feedback) => void;
}

const statuses: ReviewStatus[] = ["Not Reviewed", "Reviewed", "Needs Changes"];

export default function FeedbackForm({ chunkId, initialFeedback, onSaved }: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(initialFeedback?.rating ?? null);
  const [feedbackText, setFeedbackText] = useState(initialFeedback?.feedback_text ?? "");
  const [status, setStatus] = useState<ReviewStatus>(initialFeedback?.status ?? "Not Reviewed");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    setSaveState("saving");
    setError("");
    try {
      const saved = await saveFeedback({ chunk_id: chunkId, rating, feedback_text: feedbackText, status });
      setSaveState("saved");
      onSaved?.(saved);
      window.setTimeout(() => setSaveState("idle"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save feedback. Please try again.");
      setSaveState("error");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">Rating</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`focus-ring h-9 w-9 rounded-md border text-sm font-semibold ${
                rating === value ? "border-accent bg-accent text-white" : "border-line bg-white text-ink hover:bg-canvas"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink" htmlFor={`feedback-${chunkId}`}>
          Written feedback
        </label>
        <textarea
          id={`feedback-${chunkId}`}
          value={feedbackText}
          onChange={(event) => setFeedbackText(event.target.value)}
          placeholder="Enter feedback..."
          rows={3}
          className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink" htmlFor={`status-${chunkId}`}>
            Status
          </label>
          <select
            id={`status-${chunkId}`}
            value={status}
            onChange={(event) => setStatus(event.target.value as ReviewStatus)}
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saveState === "saving" ? "Saving..." : "Save"}
        </button>
      </div>
      {saveState === "saved" ? <p className="text-sm font-medium text-accent">Saved</p> : null}
      {error ? <p className="text-sm text-warn">{error}</p> : null}
    </div>
  );
}
