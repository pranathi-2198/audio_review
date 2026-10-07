"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getAudioUrl } from "@/lib/database";
import { formatTime } from "@/lib/utils";

interface ChunkPlayerProps {
  storagePath: string;
  chunkId: string;
  startTime: number;
  endTime: number;
}

export default function ChunkPlayer({ storagePath, chunkId, startTime, endTime }: ChunkPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [url, setUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAudioUrl(storagePath).then(setUrl).catch((err: Error) => setError(err.message));
  }, [storagePath]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  async function togglePlayback() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    document.querySelectorAll("audio[data-chunk-player='true']").forEach((node) => {
      if (node !== audioRef.current) (node as HTMLAudioElement).pause();
    });
    audioRef.current.currentTime = startTime;
    await audioRef.current.play();
    setIsPlaying(true);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      if (!audioRef.current) return;
      if (audioRef.current.currentTime >= endTime) {
        audioRef.current.pause();
        audioRef.current.currentTime = startTime;
        setIsPlaying(false);
        if (intervalRef.current) window.clearInterval(intervalRef.current);
      }
    }, 80);
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        src={url}
        data-chunk-player="true"
        preload="metadata"
        onPause={() => setIsPlaying(false)}
        onError={() => setError("Could not load this chunk from storage.")}
      />
      <button
        type="button"
        onClick={togglePlayback}
        disabled={!url || Boolean(error)}
        className="focus-ring inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        title={isPlaying ? "Pause chunk" : "Play chunk"}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        {isPlaying ? "Playing" : "Play"}
      </button>
      <span className="text-sm text-muted">
        {formatTime(startTime)} - {formatTime(endTime)}
      </span>
      {error ? <span className="text-xs text-warn">{error}</span> : null}
      <span className="sr-only">Chunk {chunkId}</span>
    </div>
  );
}
