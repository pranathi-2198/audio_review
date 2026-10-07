export type ReviewStatus = "Not Reviewed" | "Reviewed" | "Needs Changes";

export interface Track {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  storage_path: string;
  duration: number | null;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  track_id: string;
  chunk_number: number;
  start_time: number;
  end_time: number;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  chunk_id: string;
  rating: number | null;
  feedback_text: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ChunkWithFeedback extends Chunk {
  feedback: Feedback | null;
}

export interface TrackWithCounts extends Track {
  chunk_count: number;
  reviewed_count: number;
  pending_count: number;
  chunks: ChunkWithFeedback[];
}

export interface FeedbackRow {
  feedback_id: string | null;
  track_id: string;
  track_title: string;
  description: string | null;
  duration: number | null;
  chunk_id: string;
  chunk_number: number;
  start_time: number;
  end_time: number;
  rating: number | null;
  feedback_text: string | null;
  status: ReviewStatus;
  updated_at: string | null;
}
