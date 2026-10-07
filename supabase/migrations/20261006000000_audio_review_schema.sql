create extension if not exists "pgcrypto";

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  description text,
  file_name text not null,
  storage_path text not null,
  duration numeric check (duration is null or duration >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  chunk_number integer not null check (chunk_number > 0),
  start_time numeric not null check (start_time >= 0),
  end_time numeric not null check (end_time > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chunks_valid_range check (start_time < end_time),
  constraint chunks_track_number_unique unique (track_id, chunk_number)
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null references public.chunks(id) on delete cascade,
  rating integer check (rating is null or rating between 1 and 5),
  feedback_text text,
  status text not null default 'Not Reviewed' check (status in ('Not Reviewed', 'Reviewed', 'Needs Changes')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_chunk_unique unique (chunk_id)
);

create index if not exists chunks_track_id_idx on public.chunks(track_id);
create index if not exists chunks_track_number_idx on public.chunks(track_id, chunk_number);
create index if not exists feedback_status_idx on public.feedback(status);
create index if not exists feedback_updated_at_idx on public.feedback(updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_tracks_updated_at on public.tracks;
create trigger set_tracks_updated_at
before update on public.tracks
for each row execute function public.set_updated_at();

drop trigger if exists set_chunks_updated_at on public.chunks;
create trigger set_chunks_updated_at
before update on public.chunks
for each row execute function public.set_updated_at();

drop trigger if exists set_feedback_updated_at on public.feedback;
create trigger set_feedback_updated_at
before update on public.feedback
for each row execute function public.set_updated_at();

alter table public.tracks enable row level security;
alter table public.chunks enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "single reviewer can manage tracks" on public.tracks;
create policy "single reviewer can manage tracks"
on public.tracks for all
to anon
using (true)
with check (true);

drop policy if exists "single reviewer can manage chunks" on public.chunks;
create policy "single reviewer can manage chunks"
on public.chunks for all
to anon
using (true)
with check (true);

drop policy if exists "single reviewer can manage feedback" on public.feedback;
create policy "single reviewer can manage feedback"
on public.feedback for all
to anon
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('audio', 'audio', false)
on conflict (id) do nothing;

drop policy if exists "single reviewer can upload audio" on storage.objects;
create policy "single reviewer can upload audio"
on storage.objects for insert
to anon
with check (bucket_id = 'audio');

drop policy if exists "single reviewer can read audio" on storage.objects;
create policy "single reviewer can read audio"
on storage.objects for select
to anon
using (bucket_id = 'audio');

drop policy if exists "single reviewer can delete audio" on storage.objects;
create policy "single reviewer can delete audio"
on storage.objects for delete
to anon
using (bucket_id = 'audio');
