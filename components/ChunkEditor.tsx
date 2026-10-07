"use client";

import { useState } from "react";
import { replaceChunks } from "@/lib/database";
import type { Chunk } from "@/lib/types";
import { generateChunks, validateChunks } from "@/lib/utils";

interface ChunkEditorProps {
  trackId: string;
  duration: number | null;
  initialChunks: Array<Pick<Chunk, "chunk_number" | "start_time" | "end_time">>;
  onSaved: () => void;
}

export default function ChunkEditor({ trackId, duration, initialChunks, onSaved }: ChunkEditorProps) {
  const [chunkLength, setChunkLength] = useState(10);
  const [draftChunks, setDraftChunks] = useState(initialChunks);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleGenerate() {
    if (!duration) {
      setError("Track duration is required before automatic chunking.");
      return;
    }
    setError("");
    setDraftChunks(generateChunks(duration, chunkLength));
  }

  function updateChunk(index: number, key: "start_time" | "end_time", value: string) {
    const next = [...draftChunks];
    next[index] = { ...next[index], [key]: Number(value), chunk_number: index + 1 };
    setDraftChunks(next);
  }

  async function handleSave() {
    setError("");
    setMessage("");
    const validation = validateChunks(draftChunks, duration);
    if (validation) {
      setError(validation);
      return;
    }
    setIsSaving(true);
    try {
      await replaceChunks(
        trackId,
        draftChunks.map((chunk, index) => ({ ...chunk, chunk_number: index + 1 }))
      );
      setMessage("Chunks saved.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save chunks.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink" htmlFor="chunk-length">
            Chunk duration
          </label>
          <div className="flex items-center gap-2">
            <input
              id="chunk-length"
              type="number"
              min="1"
              step="1"
              value={chunkLength}
              onChange={(event) => setChunkLength(Number(event.target.value))}
              className="focus-ring w-28 rounded-md border border-line px-3 py-2"
            />
            <span className="text-sm text-muted">seconds</span>
          </div>
        </div>
        <button type="button" onClick={handleGenerate} className="focus-ring rounded-md bg-accent px-4 py-2 font-semibold text-white">
          Break Track
        </button>
        <button type="button" onClick={handleSave} disabled={isSaving} className="focus-ring rounded-md bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60">
          {isSaving ? "Saving..." : "Save Chunks"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase text-muted">
            <tr>
              <th className="py-2">Chunk</th>
              <th className="py-2">Start</th>
              <th className="py-2">End</th>
            </tr>
          </thead>
          <tbody>
            {draftChunks.map((chunk, index) => (
              <tr key={index} className="border-b border-line last:border-0">
                <td className="py-2 font-medium">Chunk {index + 1}</td>
                <td className="py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={chunk.start_time}
                    onChange={(event) => updateChunk(index, "start_time", event.target.value)}
                    className="focus-ring w-28 rounded-md border border-line px-2 py-1"
                  />
                </td>
                <td className="py-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={chunk.end_time}
                    onChange={(event) => updateChunk(index, "end_time", event.target.value)}
                    className="focus-ring w-28 rounded-md border border-line px-2 py-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {draftChunks.length === 0 ? <p className="text-sm text-muted">No chunks yet. Choose a duration and break the track.</p> : null}
      {message ? <p className="text-sm font-medium text-accent">{message}</p> : null}
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-warn">{error}</p> : null}
    </section>
  );
}
