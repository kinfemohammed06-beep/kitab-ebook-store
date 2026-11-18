-- Stage 5. Run after 004_reader.sql.
-- ===== (A) Fixes to Stage 1 policies (authors could previously edit protected fields) =====
drop policy if exists wd_insert on withdrawal_requests;        -- withdrawals now only via request_withdrawal()
drop policy if exists books_author_insert on books;
create policy books_author_insert on books for insert with check (
  author_id = auth.uid() and status = 'pending_review' and is_featured = false and published_at is null
  and exists (select 1 from author_profiles a where a.user_id = auth.uid() and a.approved));

-- Client-role (authenticated/anon) statements cannot touch protected columns. SECURITY DEFINER functions and the
-- service role run as a different database role, so they pass.
create or replace function guard_profile_update() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated','anon') and not is_admin() and (new.role <> old.role or new.status <> old.status) then
    raise exception 'role/status can only be changed by an administrator'; end if;
  return new; end $$;
create or replace function guard_author_profile() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated','anon') and not is_admin() and (new.approved <> old.approved
     or new.commission_override_pct is distinct from old.commission_override_pct or new.available_balance_etb <> old.available_balance_etb) then
    raise exception 'protected author fields can only be changed by an administrator'; end if;
  return new; end $$;
drop trigger if exists author_profiles_guard on author_profiles;
create trigger author_profiles_guard before update on author_profiles for each row execute function guard_author_profile();
create or replace function guard_book() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated','anon') and not is_admin() and (new.is_featured <> old.is_featured or new.published_at is distinct from old.published_at
     or new.slug <> old.slug or new.author_id <> old.author_id or new.is_sample_data <> old.is_sample_data
     or (new.rejection_reason is distinct from old.rejection_reason and new.rejection_reason is not null)) then
    raise exception 'protected book fields can only be changed by an administrator'; end if;
  return new; end $$;
drop trigger if exists books_guard on books;
create trigger books_guard before update on books for each row execute function guard_book();

-- ===== (B) Upload limits enforced by storage itself =====
update storage.buckets set file_size_limit = 104857600, allowed_mime_types = array['application/epub+zip','application/pdf'] where id = 'book-files';
update storage.buckets set file_size_limit = 3145728,   allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'book-covers';
update storage.buckets set file_size_limit = 5242880,   allowed_mime_types = array['image/jpeg','image/png','image/webp'] where id = 'payment-proofs';
insert into platform_settings(key,value) values ('min_withdrawal_etb','100') on conflict do nothing;

-- ===== (C) Signup + upgrade =====
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare r user_role := 'reader'; nm text := coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Author');
begin
  if new.raw_user_meta_data->>'role' in ('author','publisher') then r := (new.raw_user_meta_data->>'role')::user_role; end if;
  insert into profiles(id, full_name, email, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email, r);
  if r in ('author','publisher') then insert into author_profiles(user_id, pen_name) values (new.id, nm); end if;
  if r = 'publisher' then insert into publishers(owner_id, name) values (new.id, nm); end if;
  return new; end $$;
create or replace function become_author(p_pen_name text) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  if coalesce(trim(p_pen_name),'') = '' then raise exception 'pen name required'; end if;
  update profiles set role = 'author' where id = auth.uid() and role = 'reader';
  insert into author_profiles(user_id, pen_name) values (auth.uid(), trim(p_pen_name)) on conflict do nothing;
end $$;

-- ===== (D) Admin review functions (atomic + audited + notify) =====
create or replace function review_book(p_book_id uuid, p_approve boolean, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare b books;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select * into b from books where id = p_book_id for update;
  if not found or b.status <> 'pending_review' then raise exception 'book is not pending review'; end if;
  if p_approve then
    if not exists (select 1 from book_files where book_id = b.id and not is_sample) then raise exception 'book has no file'; end if;
    if not (select approved from author_profiles where user_id = b.author_id) then raise exception 'author is not approved'; end if;
  elsif coalesce(trim(p_reason),'') = '' then raise exception 'a reason is required'; end if;
  update books set status = case when p_approve then 'approved'::book_status else 'rejected'::book_status end,
    published_at = case when p_approve then now() end, rejection_reason = case when p_approve then null else p_reason end where id = b.id;
  insert into notifications(user_id,kind,message) values (b.author_id, case when p_approve then 'book_approved' else 'book_rejected' end,
    case when p_approve then '"'||b.title||'" is now published.' else '"'||b.title||'" was rejected: '||p_reason end);
  insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(), case when p_approve then 'book_approved' else 'book_rejected' end,'book',b.id::text,jsonb_build_object('title',b.title,'reason',p_reason));
end $$;

create or replace function admin_update_book(p_book_id uuid, p_featured boolean, p_price numeric, p_remove boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare b books;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_price < 0 then raise exception 'invalid price'; end if;
  select * into b from books where id = p_book_id for update; if not found then raise exception 'not found'; end if;
  update books set is_featured = p_featured, price_etb = p_price, status = case when p_remove then 'removed'::book_status else status end where id = b.id;
  if p_price <> b.price_etb then insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(),'price_changed','book',b.id::text,jsonb_build_object('old',b.price_etb,'new',p_price)); end if;
  if p_featured <> b.is_featured then insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(),'featured_changed','book',b.id::text,jsonb_build_object('featured',p_featured)); end if;
  if p_remove then insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(),'book_removed','book',b.id::text,jsonb_build_object('title',b.title)); end if;
end $$;

create or replace function review_author(p_user_id uuid, p_approved boolean, p_commission numeric default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_commission is not null and (p_commission < 0 or p_commission > 100) then raise exception 'commission must be 0-100'; end if;
  update author_profiles set approved = p_approved, commission_override_pct = p_commission where user_id = p_user_id;
  if not found then raise exception 'author not found'; end if;
  insert into notifications(user_id,kind,message) values (p_user_id,'author_status', case when p_approved then 'Your author account is approved. You can now upload books.' else 'Your author account has been suspended.' end);
  insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(), case when p_approved then 'author_approved' else 'author_suspended' end,'author',p_user_id::text,jsonb_build_object('commission_override',p_commission));
end $$;

-- ===== (E) Withdrawals: amount is held at request time, refunded on rejection =====
create or replace function request_withdrawal(p_amount numeric, p_details text) returns void
language plpgsql security definer set search_path = public as $$
declare a author_profiles; m numeric;
begin
  select * into a from author_profiles where user_id = auth.uid() for update;
  if not found or not a.approved then raise exception 'not an approved author'; end if;
  select coalesce((value#>>'{}')::numeric, 100) into m from platform_settings where key = 'min_withdrawal_etb';
  if coalesce(trim(p_details),'') = '' then raise exception 'payout details required'; end if;
  if p_amount < coalesce(m,100) then raise exception 'minimum withdrawal is ETB %', coalesce(m,100); end if;
  if p_amount > a.available_balance_etb then raise exception 'amount exceeds your available balance'; end if;
  update author_profiles set available_balance_etb = available_balance_etb - p_amount where user_id = a.user_id;
  insert into withdrawal_requests(author_id, amount_etb, payout_details) values (a.user_id, p_amount, p_details);
end $$;

create or replace function process_withdrawal(p_id uuid, p_action text, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare w withdrawal_requests; ns withdrawal_status;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select * into w from withdrawal_requests where id = p_id for update; if not found then raise exception 'not found'; end if;
  if p_action = 'approve' and w.status = 'pending' then ns := 'approved';
  elsif p_action = 'paid' and w.status = 'approved' then
    ns := 'paid'; insert into transactions(kind, amount_etb) values ('payout', w.amount_etb);
  elsif p_action = 'reject' and w.status in ('pending','approved') then
    if coalesce(trim(p_note),'') = '' then raise exception 'a reason is required'; end if;
    ns := 'rejected'; update author_profiles set available_balance_etb = available_balance_etb + w.amount_etb where user_id = w.author_id;
  else raise exception 'invalid action for status %', w.status; end if;
  update withdrawal_requests set status = ns, admin_note = coalesce(p_note, admin_note), processed_by = auth.uid() where id = w.id;
  insert into notifications(user_id,kind,message) values (w.author_id,'withdrawal_'||ns::text,'Your withdrawal of ETB '||w.amount_etb||' is now '||ns::text||coalesce(' ('||p_note||')',''));
  insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(),'withdrawal_'||ns::text,'withdrawal',w.id::text,jsonb_build_object('amount',w.amount_etb,'note',p_note));
end $$;

create view admin_stats with (security_invoker = true) as select
  (select count(*) from profiles) users, (select count(*) from author_profiles) authors,
  (select count(*) from books where status = 'approved') published, (select count(*) from books where status = 'pending_review') pending_books,
  (select count(*) from orders where status = 'paid' and total_etb > 0) sales, (select coalesce(sum(total_etb),0) from orders where status = 'paid') revenue,
  (select count(*) from payments where status in ('submitted','needs_info')) pending_payments, (select count(*) from payments where status = 'approved') approved_payments,
  (select count(*) from withdrawal_requests where status in ('pending','approved')) pending_withdrawals,
  (select coalesce(sum(commission_etb),0) from author_earnings) commissions;
