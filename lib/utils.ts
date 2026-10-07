import type { Chunk } from "@/lib/types";

export function formatTime(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) return "00:00";
  const safeSeconds = Math.max(0, seconds);
  const whole = Math.floor(safeSeconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  const hours = Math.floor(mins / 60);
  const displayMins = mins % 60;
  if (hours > 0) {
    return `${hours}:${String(displayMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(displayMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function generateChunks(duration: number, chunkLength: number): Array<Pick<Chunk, "chunk_number" | "start_time" | "end_time">> {
  if (duration <= 0 || chunkLength <= 0) return [];
  const chunks: Array<Pick<Chunk, "chunk_number" | "start_time" | "end_time">> = [];
  let start = 0;
  let chunkNumber = 1;
  while (start < duration) {
    const end = Math.min(start + chunkLength, duration);
    chunks.push({
      chunk_number: chunkNumber,
      start_time: Number(start.toFixed(3)),
      end_time: Number(end.toFixed(3))
    });
    start = end;
    chunkNumber += 1;
  }
  return chunks;
}

export function validateChunks(
  chunks: Array<Pick<Chunk, "start_time" | "end_time">>,
  duration: number | null
): string | null {
  if (!chunks.length) return "Create at least one chunk.";
  let previousEnd = 0;
  for (const [index, chunk] of chunks.entries()) {
    if (chunk.start_time < 0 || chunk.end_time < 0) return `Chunk ${index + 1} has a negative timestamp.`;
    if (chunk.start_time >= chunk.end_time) return `Chunk ${index + 1} must end after it starts.`;
    if (duration !== null && chunk.end_time > duration + 0.001) return `Chunk ${index + 1} ends after the track duration.`;
    if (index > 0 && chunk.start_time < previousEnd - 0.001) return `Chunk ${index + 1} overlaps the previous chunk.`;
    previousEnd = chunk.end_time;
  }
  return null;
}

export function isSupportedAudio(file: File): boolean {
  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a"];
  const allowedExtensions = [".mp3", ".wav", ".m4a"];
  return allowedTypes.includes(file.type) || allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
}
