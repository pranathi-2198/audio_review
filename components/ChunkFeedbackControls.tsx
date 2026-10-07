"use client";

import { useEffect, useState } from "react";
import { saveFeedback } from "@/lib/database";
import type { Feedback, ReviewStatus } from "@/lib/types";

interface ChunkFeedbackControlsProps {
  chunkId: string;
  initialFeedback: Feedback | null;
  onSaved?: (feedback: Feedback) => void;
}

const statuses: ReviewStatus[] = ["Not Reviewed", "Reviewed", "Needs Changes"];

export default function ChunkFeedbackControls({ chunkId, initialFeedback, onSaved }: ChunkFeedbackControlsProps) {
  const [rating, setRating] = useState<number | null>(initialFeedback?.rating ?? null);
  const [feedbackText, setFeedbackText] = useState(initialFeedback?.feedback_text ?? "");
  const [status, setStatus] = useState<ReviewStatus>(initialFeedback?.status ?? "Not Reviewed");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setRating(initialFeedback?.rating ?? null);
    setFeedbackText(initialFeedback?.feedback_text ?? "");
    setStatus(initialFeedback?.status ?? "Not Reviewed");
    setSaveState("idle");
    setError("");
  }, [chunkId, initialFeedback]);

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
    <div className="grid gap-2 md:grid-cols-[auto_150px_minmax(200px,1fr)_auto] md:items-start">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`focus-ring h-8 w-8 rounded-md border text-xs font-semibold ${
              rating === value ? "border-accent bg-accent text-white" : "border-line bg-white text-ink hover:bg-white"
            }`}
            title={`Rating ${value}`}
          >
            {value}
          </button>
        ))}
      </div>
      <select value={status} onChange={(event) => setStatus(event.target.value as ReviewStatus)} className="focus-ring rounded-md border border-line bg-white px-2 py-2 text-sm">
        {statuses.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      <textarea
        value={feedbackText}
        onChange={(event) => setFeedbackText(event.target.value)}
        placeholder="Enter feedback..."
        rows={2}
        className="focus-ring min-h-16 resize-y rounded-md border border-line bg-white px-3 py-2 text-sm"
      />
      <div className="space-y-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="focus-ring w-full rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saveState === "saving" ? "Saving..." : "Save"}
        </button>
        {saveState === "saved" ? <p className="text-xs font-medium text-accent">Saved</p> : null}
        {error ? <p className="max-w-40 text-xs text-warn">{error}</p> : null}
      </div>
    </div>
  );
}
