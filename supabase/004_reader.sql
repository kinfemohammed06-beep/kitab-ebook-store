-- Stage 4. Run after 003_stage3.sql.
create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id),
  format text not null,
  created_at timestamptz not null default now()
);
alter table downloads enable row level security;
create policy downloads_own on downloads for select using (user_id = auth.uid() or is_admin());

-- To test the reader before the author upload page exists (Stage 5):
-- 1) Supabase > Storage > book-files: upload a small .epub or .pdf (e.g. demo/test.epub)
-- 2) insert into book_files(book_id, format, storage_path, size_bytes)
--      select id, 'epub', 'demo/test.epub', 100000 from books where slug = 'sample-the-long-road';
-- 3) Buy/approve it (or take a free book) so it is in your library.
