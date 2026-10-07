"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Edit, ExternalLink, Trash2 } from "lucide-react";
import { deleteTrack, getDashboardTracks } from "@/lib/database";
import type { Feedback, TrackWithCounts } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";
import ChunkFeedbackControls from "@/components/ChunkFeedbackControls";
import AudioPlayer from "@/components/AudioPlayer";
import ChunkPlayer from "@/components/ChunkPlayer";

export default function Dashboard() {
  const [tracks, setTracks] = useState<TrackWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setTracks(await getDashboardTracks());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const totalChunks = tracks.reduce((sum, track) => sum + track.chunk_count, 0);
    const allChunks = tracks.flatMap((track) => track.chunks);
    const reviewed = allChunks.filter((chunk) => chunk.feedback?.status === "Reviewed").length;
    const needsChanges = allChunks.filter((chunk) => chunk.feedback?.status === "Needs Changes").length;
    return {
      totalTracks: tracks.length,
      totalChunks,
      reviewed,
      pending: allChunks.filter((chunk) => !chunk.feedback || chunk.feedback.status === "Not Reviewed").length,
      needsChanges
    };
  }, [tracks]);

  function handleFeedbackSaved(trackId: string, chunkId: string, feedback: Feedback) {
    setTracks((current) =>
      current.map((track) =>
        track.id === trackId
          ? {
              ...track,
              chunks: track.chunks.map((chunk) => (chunk.id === chunkId ? { ...chunk, feedback } : chunk)),
              reviewed_count: track.chunks.filter((chunk) => (chunk.id === chunkId ? feedback.status : chunk.feedback?.status) === "Reviewed").length,
              pending_count: track.chunks.filter((chunk) => (chunk.id === chunkId ? feedback.status : chunk.feedback?.status ?? "Not Reviewed") === "Not Reviewed").length
            }
          : track
      )
    );
  }

  async function handleDelete(track: TrackWithCounts) {
    if (!window.confirm(`Delete "${track.title}" and all related chunks and feedback?`)) return;
    try {
      await deleteTrack(track);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete track.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total Tracks", summary.totalTracks],
          ["Total Chunks", summary.totalChunks],
          ["Reviewed", summary.reviewed],
          ["Pending", summary.pending],
          ["Needs Changes", summary.needsChanges]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-white p-4 shadow-sm">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-line bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">Tracks</h1>
            <p className="text-sm text-muted">Review every chunk directly in the table.</p>
          </div>
          <Link href="/tracks" className="focus-ring rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">
            Add Track
          </Link>
        </div>
        {error ? <p className="m-4 rounded-md bg-red-50 p-3 text-sm text-warn">{error}</p> : null}
        {loading ? <p className="p-4 text-sm text-muted">Loading tracks...</p> : null}
        {!loading && tracks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-medium text-ink">No tracks uploaded yet.</p>
            <p className="mt-1 text-sm text-muted">Upload your first audio track to begin.</p>
          </div>
        ) : null}
        {tracks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs uppercase text-muted">
                <tr>
                  <th className="w-[310px] px-4 py-3">Track</th>
                  <th className="w-[220px] px-4 py-3">Description</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="w-[680px] px-4 py-3">Chunks, Rating & Feedback</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id} className="align-top border-b border-line last:border-0">
                    <td className="px-4 py-4">
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-ink">{track.title}</p>
                          <p className="mt-1 text-xs text-muted">{track.file_name}</p>
                        </div>
                        <AudioPlayer storagePath={track.storage_path} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      <p className="max-w-[220px] whitespace-pre-wrap break-words">{track.description || "-"}</p>
                    </td>
                    <td className="px-4 py-3">{formatTime(track.duration)}</td>
                    <td className="px-4 py-4">
                      {track.chunks.length > 0 ? (
                        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                          {track.chunks.map((chunk) => (
                            <div key={chunk.id} className="rounded-md border border-line bg-canvas p-2">
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-ink">Chunk {chunk.chunk_number}</p>
                                <p className="text-xs text-muted">
                                  {formatTime(chunk.start_time)} - {formatTime(chunk.end_time)}
                                </p>
                              </div>
                              <ChunkPlayer
                                storagePath={track.storage_path}
                                chunkId={chunk.id}
                                startTime={Number(chunk.start_time)}
                                endTime={Number(chunk.end_time)}
                              />
                              <div className="mt-3">
                                <ChunkFeedbackControls
                                  chunkId={chunk.id}
                                  initialFeedback={chunk.feedback}
                                  onSaved={(feedback) => handleFeedbackSaved(track.id, chunk.id, feedback)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-line p-3 text-sm text-muted">
                          No chunks yet. Open the track and use Break Track.
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{track.reviewed_count} / {track.chunk_count} reviewed</td>
                    <td className="px-4 py-3">{formatDate(track.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link className="focus-ring rounded-md border border-line p-2 hover:bg-canvas" href={`/tracks/${track.id}`} title="Open">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link className="focus-ring rounded-md border border-line p-2 hover:bg-canvas" href={`/tracks/${track.id}`} title="Edit">
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button className="focus-ring rounded-md border border-line p-2 text-warn hover:bg-red-50" onClick={() => handleDelete(track)} title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
