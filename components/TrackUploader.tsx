"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { createTrack, updateTrackStorage, uploadAudio } from "@/lib/database";
import { isSupportedAudio } from "@/lib/utils";

const MAX_FILE_SIZE = 200 * 1024 * 1024;

function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    audio.onerror = () => resolve(null);
    audio.src = URL.createObjectURL(file);
  });
}

export default function TrackUploader() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!title.trim()) return setError("Track title is required.");
    if (!file) return setError("Choose an audio file.");
    if (!isSupportedAudio(file)) return setError("Upload an MP3, WAV, or M4A file.");
    if (file.size > MAX_FILE_SIZE) return setError("Audio files must be 200 MB or smaller.");

    setIsSaving(true);
    try {
      const duration = await readDuration(file);
      const track = await createTrack({
        title: title.trim(),
        description: description.trim() || null,
        file_name: file.name,
        storage_path: "pending",
        duration
      });
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const storagePath = `${track.id}/original-${safeName}`;
      await uploadAudio(file, storagePath, setProgress);
      await updateTrackStorage(track.id, storagePath, duration, file.name);
      router.push(`/tracks/${track.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-line bg-white p-5 shadow-sm">
      <div>
        <label className="mb-2 block text-sm font-medium text-ink" htmlFor="title">
          Track Title *
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="focus-ring w-full rounded-md border border-line px-3 py-2"
          placeholder="e.g. Mix v3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="focus-ring w-full rounded-md border border-line px-3 py-2"
          rows={3}
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-ink" htmlFor="audio">
          Audio File *
        </label>
        <input
          ref={fileRef}
          id="audio"
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="focus-ring w-full rounded-md border border-dashed border-line bg-canvas px-3 py-5 text-sm"
        />
        <p className="mt-2 text-xs text-muted">MP3, WAV, or M4A. Maximum 200 MB.</p>
      </div>
      {progress > 0 ? (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">{progress}% uploaded</p>
        </div>
      ) : null}
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-warn">{error}</p> : null}
      <button
        type="submit"
        disabled={isSaving}
        className="focus-ring inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {isSaving ? "Uploading..." : "Upload Track"}
      </button>
    </form>
  );
}
