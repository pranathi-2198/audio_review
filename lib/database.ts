"use client";

import { assertSupabaseConfigured, audioBucket, supabase } from "@/lib/supabase";
import type { Chunk, ChunkWithFeedback, Feedback, FeedbackRow, ReviewStatus, Track, TrackWithCounts } from "@/lib/types";

export async function getAudioUrl(storagePath: string): Promise<string> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.storage.from(audioBucket).createSignedUrl(storagePath, 60 * 60);
  if (error || !data?.signedUrl) throw new Error(error?.message || "Could not create a signed audio URL.");
  return data.signedUrl;
}

export async function uploadAudio(file: File, storagePath: string, onProgress?: (progress: number) => void): Promise<void> {
  assertSupabaseConfigured();
  onProgress?.(20);
  const { error } = await supabase.storage.from(audioBucket).upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type || "audio/mpeg",
    upsert: false
  });
  if (error) throw new Error(error.message);
  onProgress?.(100);
}

export async function createTrack(input: Pick<Track, "title" | "description" | "file_name" | "storage_path" | "duration">): Promise<Track> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.from("tracks").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateTrack(id: string, input: Pick<Track, "title" | "description">): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await supabase.from("tracks").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateTrackStorage(id: string, storagePath: string, duration: number | null, fileName: string): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await supabase.from("tracks").update({ storage_path: storagePath, duration, file_name: fileName }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTrack(track: Track): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await supabase.from("tracks").delete().eq("id", track.id);
  if (error) throw new Error(error.message);
  await supabase.storage.from(audioBucket).remove([track.storage_path]);
}

export async function listTracks(): Promise<Track[]> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.from("tracks").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getTrack(id: string): Promise<Track | null> {
  assertSupabaseConfigured();
  const { data, error } = await supabase.from("tracks").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listChunks(trackId: string): Promise<Chunk[]> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("chunks")
    .select("*")
    .eq("track_id", trackId)
    .order("chunk_number", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function listChunksWithFeedback(trackId: string): Promise<ChunkWithFeedback[]> {
  assertSupabaseConfigured();
  const [chunks, feedback] = await Promise.all([
    supabase.from("chunks").select("*").eq("track_id", trackId).order("chunk_number", { ascending: true }),
    supabase.from("feedback").select("*")
  ]);
  if (chunks.error) throw new Error(chunks.error.message);
  if (feedback.error) throw new Error(feedback.error.message);

  return (chunks.data || []).map((chunk) => ({
    ...chunk,
    feedback: (feedback.data || []).find((item) => item.chunk_id === chunk.id) ?? null
  }));
}

export async function replaceChunks(trackId: string, chunks: Array<Pick<Chunk, "chunk_number" | "start_time" | "end_time">>): Promise<void> {
  assertSupabaseConfigured();
  const { error: deleteError } = await supabase.from("chunks").delete().eq("track_id", trackId);
  if (deleteError) throw new Error(deleteError.message);
  const rows = chunks.map((chunk) => ({ ...chunk, track_id: trackId }));
  const { error } = await supabase.from("chunks").insert(rows);
  if (error) throw new Error(error.message);
}

export async function saveFeedback(input: {
  chunk_id: string;
  rating: number | null;
  feedback_text: string;
  status: ReviewStatus;
}): Promise<Feedback> {
  assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("feedback")
    .upsert(input, { onConflict: "chunk_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getDashboardTracks(): Promise<TrackWithCounts[]> {
  assertSupabaseConfigured();
  const [tracks, chunks, feedback] = await Promise.all([
    listTracks(),
    supabase.from("chunks").select("*").order("chunk_number", { ascending: true }),
    supabase.from("feedback").select("*")
  ]);
  if (chunks.error) throw new Error(chunks.error.message);
  if (feedback.error) throw new Error(feedback.error.message);

  return tracks.map((track) => {
    const trackChunks = (chunks.data || [])
      .filter((chunk) => chunk.track_id === track.id)
      .map((chunk) => ({
        ...chunk,
        feedback: (feedback.data || []).find((item) => item.chunk_id === chunk.id) ?? null
      }));
    const reviewedCount = trackChunks.filter((chunk) => chunk.feedback?.status === "Reviewed").length;
    return {
      ...track,
      chunk_count: trackChunks.length,
      reviewed_count: reviewedCount,
      pending_count: trackChunks.length - reviewedCount,
      chunks: trackChunks
    };
  });
}

export async function listFeedbackRows(): Promise<FeedbackRow[]> {
  assertSupabaseConfigured();
  const [tracks, chunks, feedback] = await Promise.all([
    listTracks(),
    supabase.from("chunks").select("*").order("chunk_number", { ascending: true }),
    supabase.from("feedback").select("*")
  ]);
  if (chunks.error) throw new Error(chunks.error.message);
  if (feedback.error) throw new Error(feedback.error.message);

  return tracks.flatMap((track) =>
    (chunks.data || [])
      .filter((chunk) => chunk.track_id === track.id)
      .map((chunk) => {
        const chunkFeedback = (feedback.data || []).find((item) => item.chunk_id === chunk.id);
        return {
          feedback_id: chunkFeedback?.id ?? null,
          track_id: track.id,
          track_title: track.title,
          description: track.description,
          duration: track.duration,
          chunk_id: chunk.id,
          chunk_number: chunk.chunk_number,
          start_time: chunk.start_time,
          end_time: chunk.end_time,
          rating: chunkFeedback?.rating ?? null,
          feedback_text: chunkFeedback?.feedback_text ?? null,
          status: chunkFeedback?.status ?? "Not Reviewed",
          updated_at: chunkFeedback?.updated_at ?? null
        };
      })
  );
}
