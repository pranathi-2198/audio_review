"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FeedbackRow, ReviewStatus } from "@/lib/types";
import { listFeedbackRows } from "@/lib/database";
import { formatDate, formatTime } from "@/lib/utils";

type StatusFilter = "All" | ReviewStatus;
type SortKey = "Track" | "Chunk" | "Rating" | "Status" | "Updated";

export default function FeedbackTable() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("Updated");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listFeedbackRows()
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const visibleRows = useMemo(() => {
    const filtered = filter === "All" ? rows : rows.filter((row) => row.status === filter);
    return [...filtered].sort((a, b) => {
      if (sortKey === "Track") return a.track_title.localeCompare(b.track_title);
      if (sortKey === "Chunk") return a.track_title.localeCompare(b.track_title) || a.chunk_number - b.chunk_number;
      if (sortKey === "Rating") return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortKey === "Status") return a.status.localeCompare(b.status);
      return new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime();
    });
  }, [rows, filter, sortKey]);

  return (
    <section className="rounded-lg border border-line bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Feedback</h1>
          <p className="text-sm text-muted">Review chunk-level ratings, notes, and status in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", "Reviewed", "Not Reviewed", "Needs Changes"] as StatusFilter[]).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`focus-ring rounded-md border px-3 py-2 text-sm ${
                filter === item ? "border-accent bg-accent text-white" : "border-line bg-white text-ink hover:bg-canvas"
              }`}
            >
              {item}
          </button>
          ))}
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="focus-ring rounded-md border border-line px-3 py-2 text-sm">
            {(["Updated", "Track", "Chunk", "Rating", "Status"] as SortKey[]).map((key) => (
              <option key={key}>{key}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? <p className="p-4 text-sm text-muted">Loading feedback...</p> : null}
      {error ? <p className="m-4 rounded-md bg-red-50 p-3 text-sm text-warn">{error}</p> : null}
      {!loading && visibleRows.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-medium text-ink">No feedback submitted yet.</p>
          <p className="mt-1 text-sm text-muted">Create chunks and save chunk feedback from the dashboard to populate this table.</p>
        </div>
      ) : null}
      {visibleRows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Track</th>
                <th className="px-4 py-3">Chunk</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Feedback</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.chunk_id} className="border-b border-line last:border-0 hover:bg-canvas">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/tracks/${row.track_id}#chunk-${row.chunk_id}`}>{row.track_title}</Link>
                  </td>
                  <td className="px-4 py-3">Chunk {row.chunk_number}</td>
                  <td className="px-4 py-3">{formatTime(row.start_time)} - {formatTime(row.end_time)}</td>
                  <td className="px-4 py-3">{row.rating ?? "-"}</td>
                  <td className="max-w-sm truncate px-4 py-3 text-muted">{row.feedback_text || "-"}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3">{formatDate(row.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
