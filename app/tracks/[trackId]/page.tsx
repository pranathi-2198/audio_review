"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import ChunkEditor from "@/components/ChunkEditor";
import ChunkPlayer from "@/components/ChunkPlayer";
import { getTrack, listChunks } from "@/lib/database";
import type { Chunk, Track } from "@/lib/types";
import { formatTime } from "@/lib/utils";

export default function TrackReviewPage() {
  const params = useParams<{ trackId: string }>();
  const router = useRouter();
  const [track, setTrack] = useState<Track | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const loadedTrack = await getTrack(params.trackId);
      if (!loadedTrack) {
        notFound();
        return;
      }
      setTrack(loadedTrack);
      setChunks(await listChunks(params.trackId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load track.");
    } finally {
      setLoading(false);
    }
  }, [params.trackId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-muted">Loading track...</p>;
  if (!track) return <p className="rounded-md bg-red-50 p-3 text-sm text-warn">Missing track.</p>;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink">{track.title}</h1>
            <p className="mt-1 text-sm text-muted">{track.description || "No description provided."}</p>
          </div>
          <div className="rounded-md bg-canvas px-3 py-2 text-sm font-medium text-ink">Duration {formatTime(track.duration)}</div>
        </div>
        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-warn">{error}</p> : null}
        <AudioPlayer storagePath={track.storage_path} />
      </section>

      <ChunkEditor
        trackId={track.id}
        duration={track.duration}
        initialChunks={chunks}
        onSaved={() => {
          load();
          router.refresh();
        }}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">Chunks</h2>
          <p className="text-sm text-muted">Each chunk plays from the original file using saved timestamps. Add ratings and feedback from the dashboard track table.</p>
        </div>
        {chunks.length === 0 ? (
          <div className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
            <p className="font-medium text-ink">No chunks created yet.</p>
            <p className="mt-1 text-sm text-muted">Use Break Track above to generate timestamp chunks.</p>
          </div>
        ) : null}
        {chunks.map((chunk) => (
          <article id={`chunk-${chunk.id}`} key={chunk.id} className="rounded-lg border border-line bg-white p-5 shadow-sm">
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold text-ink">Chunk {chunk.chunk_number}</h3>
                <span className="text-sm text-muted">
                  {formatTime(chunk.start_time)} - {formatTime(chunk.end_time)}
                </span>
              </div>
              <ChunkPlayer storagePath={track.storage_path} chunkId={chunk.id} startTime={chunk.start_time} endTime={chunk.end_time} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
