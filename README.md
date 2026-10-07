# Audio Review App

A production-ready internal audio review tool built with Next.js, TypeScript, Tailwind CSS, Supabase PostgreSQL, Supabase Storage, and Vercel.

The app is intentionally single-reviewer. There are no teams, roles, or social login flows. Feedback is persisted in Supabase PostgreSQL, and audio files are stored once in Supabase Storage.

## Features

- Upload MP3, WAV, and M4A audio files to Supabase Storage.
- Store track metadata in PostgreSQL.
- Generate timestamp-based chunks without creating duplicate audio files.
- Play the full track or a chunk that seeks into the original file and auto-pauses at the chunk end time.
- Save and update one feedback row per chunk with rating, written notes, and status directly from the dashboard table or track review page.
- View all chunk feedback in a persistent sortable/filterable table.
- Dashboard summary cards for total tracks, total chunks, reviewed, and pending.
- Vercel-ready App Router architecture.

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_AUDIO_BUCKET=audio
```

`.env.local` is ignored by Git. Do not add service-role keys to client-side environment variables.

## Supabase Setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/migrations/20261006000000_audio_review_schema.sql`.
3. Confirm the migration created:
   - `tracks`
   - `chunks`
   - `feedback`
   - A private Storage bucket named `audio`
   - Storage object policies for the `audio` bucket
4. Copy the project URL and anon key into `.env.local`.

## Database Schema

`tracks` stores one row per uploaded audio track:

- `id`
- `title`
- `description`
- `file_name`
- `storage_path`
- `duration`
- `created_at`
- `updated_at`

`chunks` stores timestamp references into the original track:

- `id`
- `track_id`
- `chunk_number`
- `start_time`
- `end_time`
- `created_at`
- `updated_at`

`feedback` stores one feedback row per chunk:

- `id`
- `chunk_id`
- `rating`
- `feedback_text`
- `status`
- `created_at`
- `updated_at`

`feedback.chunk_id` has a unique constraint, so saving chunk feedback updates the existing row instead of creating duplicates.

## Audio Chunk Playback

The app never creates separate audio files for chunks. If a track has five chunks, Supabase Storage still contains only the original uploaded audio file.

When the reviewer clicks Play on a chunk, the chunk player:

1. Requests a signed URL for the original file.
2. Sets the audio element `currentTime` to `start_time`.
3. Calls `play()` from the user click.
4. Monitors playback time.
5. Pauses and resets when `currentTime` reaches `end_time`.

Only one chunk player is allowed to play at a time.

## GitHub

```bash
git init
git add .
git commit -m "Build audio review app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Vercel Deployment

1. Push this repository to GitHub.
2. In Vercel, choose **Add New Project**.
3. Import the GitHub repository.
4. Add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_AUDIO_BUCKET`
5. Deploy.
6. Open the production URL and verify:
   - Track upload works.
   - Audio playback works.
   - Chunk creation stores timestamps.
   - Chunk feedback remains after refresh and reopening the site.

## Build Check

```bash
npm run build
```

## Troubleshooting

- **Missing environment variables:** Add the Supabase URL and anon key to `.env.local` locally and to Vercel project settings in production.
- **Upload fails:** Confirm the `audio` bucket exists and the Storage policies from the migration are installed.
- **Audio does not play:** Confirm `storage_path` points to an object in the `audio` bucket and signed URLs are being generated.
- **Feedback duplicates:** Confirm the `feedback_chunk_unique` constraint exists on `feedback(chunk_id)`.
- **Dashboard counts look stale:** Refresh the page after chunk or feedback edits; all counts are loaded from Supabase.
