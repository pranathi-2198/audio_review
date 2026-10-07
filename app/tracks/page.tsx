import TrackUploader from "@/components/TrackUploader";

export default function TracksPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Add Track</h1>
        <p className="mt-1 text-sm text-muted">Upload one original audio file and store its metadata in Supabase.</p>
      </div>
      <TrackUploader />
    </div>
  );
}
