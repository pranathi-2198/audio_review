"use client";

import { useEffect, useState } from "react";
import { getAudioUrl } from "@/lib/database";

export default function AudioPlayer({ storagePath }: { storagePath: string }) {
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;
    getAudioUrl(storagePath)
      .then((signedUrl) => active && setUrl(signedUrl))
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [storagePath]);

  if (error) return <p className="rounded-md bg-red-50 p-3 text-sm text-warn">{error}</p>;
  if (!url) return <div className="h-12 animate-pulse rounded-md bg-slate-100" />;

  return <audio className="w-full" controls src={url} preload="metadata" />;
}
