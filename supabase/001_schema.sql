-- Ethiopian Ebook Marketplace: Stage 1 schema (Supabase / PostgreSQL)
-- Run in the Supabase SQL editor. "users" = auth.users (managed by Supabase Auth).

create extension if not exists pg_trgm;

create type user_role as enum ('reader','author','publisher','admin');
create type account_status as enum ('active','suspended');
create type book_status as enum ('draft','pending_review','approved','rejected','removed');
create type order_status as enum ('pending_payment','awaiting_verification','paid','rejected','cancelled','refunded');
create type payment_status as enum ('submitted','needs_info','approved','rejected');
create type withdrawal_status as enum ('pending','approved','paid','rejected');

-- ---------- identity ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'reader',
  status account_status not null default 'active',
  preferred_language text not null default 'en' check (preferred_language in ('en','am','om','ti')),
  created_at timestamptz not null default now()
);

create table author_profiles (
  user_id uuid primary key references profiles(id) on delete cascade,
  pen_name text not null,
  bio text,
  approved boolean not null default false,
  commission_override_pct numeric(5,2) check (commission_override_pct between 0 and 100),
  available_balance_etb numeric(12,2) not null default 0 check (available_balance_etb >= 0),
  created_at timestamptz not null default now()
);

create table publishers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  approved boolean not null default false
);

-- ---------- catalogue ----------
create table categories (
  id serial primary key,
  parent_id int references categories(id),
  slug text unique not null,
  name_en text not null, name_am text, name_om text, name_ti text
);

create table books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  author_id uuid not null references author_profiles(user_id),
  publisher_id uuid references publishers(id),
  language text not null default 'en',
  isbn text unique,
  pages int check (pages > 0),
  price_etb numeric(10,2) not null default 0 check (price_etb >= 0),
  is_free boolean generated always as (price_etb = 0) stored,
  cover_path text,
  status book_status not null default 'pending_review',
  rejection_reason text,
  is_featured boolean not null default false,
  is_sample_data boolean not null default false,  -- keeps demo books distinguishable
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create index books_status_idx on books(status);
create index books_title_trgm on books using gin (title gin_trgm_ops);

create table book_categories (
  book_id uuid references books(id) on delete cascade,
  category_id int references categories(id) on delete cascade,
  primary key (book_id, category_id)
);

create table book_files (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  format text not null check (format in ('epub','pdf','mobi')),
  storage_path text not null,            -- private bucket "book-files"
  size_bytes bigint not null check (size_bytes > 0),
  is_sample boolean not null default false,
  unique (book_id, format, is_sample)
);

-- ---------- commerce ----------
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  percent_off numeric(5,2) check (percent_off between 1 and 100),
  fixed_off_etb numeric(10,2) check (fixed_off_etb > 0),
  expires_at timestamptz,
  max_uses int,
  used_count int not null default 0,
  check ((percent_off is null) <> (fixed_off_etb is null))
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('ORD-' || to_char(now(),'YYMMDD') || '-' || substr(gen_random_uuid()::text,1,6)),
  user_id uuid not null references profiles(id),
  coupon_id uuid references coupons(id),
  subtotal_etb numeric(12,2) not null check (subtotal_etb >= 0),
  discount_etb numeric(12,2) not null default 0 check (discount_etb >= 0),
  total_etb numeric(12,2) not null check (total_etb >= 0),
  status order_status not null default 'pending_payment',
  gift_recipient_email text,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  book_id uuid not null references books(id),
  price_etb numeric(10,2) not null check (price_etb >= 0),  -- price frozen at purchase
  unique (order_id, book_id)
);

create table coupon_redemptions (
  coupon_id uuid references coupons(id),
  order_id uuid references orders(id),
  user_id uuid references profiles(id),
  primary key (coupon_id, order_id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  method text not null default 'telebirr_manual',
  reference_no text not null,
  amount_etb numeric(12,2) not null check (amount_etb > 0),
  status payment_status not null default 'submitted',
  reviewer_note text,
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);
-- No two live payments may claim the same Telebirr reference (rejected ones may be resubmitted).
create unique index payments_reference_unique
  on payments (method, upper(reference_no)) where status <> 'rejected';

create table payment_screenshots (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  storage_path text not null,            -- private bucket "payment-proofs", admin-only
  uploaded_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  payment_id uuid references payments(id),
  kind text not null check (kind in ('sale','commission','author_earning','refund','payout')),
  amount_etb numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table author_earnings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references author_profiles(user_id),
  order_item_id uuid not null unique references order_items(id),
  gross_etb numeric(12,2) not null,
  commission_pct numeric(5,2) not null,
  commission_etb numeric(12,2) not null,
  net_etb numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references author_profiles(user_id),
  amount_etb numeric(12,2) not null check (amount_etb > 0),
  payout_details text not null,
  status withdrawal_status not null default 'pending',
  admin_note text,
  processed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- reader ----------
create table libraries (
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id),
  order_id uuid references orders(id),
  acquired_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create table reading_progress (
  user_id uuid, book_id uuid, location text not null, percent numeric(5,2) default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id),
  foreign key (user_id, book_id) references libraries(user_id, book_id) on delete cascade
);
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, book_id uuid not null,
  location text not null, note text, highlight_text text,
  created_at timestamptz not null default now(),
  foreign key (user_id, book_id) references libraries(user_id, book_id) on delete cascade
);
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null, book_id uuid not null,
  rating int not null check (rating between 1 and 5),
  body text, reported boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, book_id),
  foreign key (user_id, book_id) references libraries(user_id, book_id) -- verified purchasers only
);
create table wishlists (
  user_id uuid references profiles(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  primary key (user_id, book_id)
);

-- ---------- platform ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null, message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create table admin_logs (
  id bigserial primary key,
  admin_id uuid not null references profiles(id),
  action text not null, target_type text, target_id text, detail jsonb,
  created_at timestamptz not null default now()
);
create table platform_settings (
  key text primary key, value jsonb not null,
  updated_by uuid references profiles(id), updated_at timestamptz not null default now()
);
insert into platform_settings(key,value) values
  ('commission_pct','20'),
  ('telebirr_number','"SET-IN-ADMIN"'),
  ('telebirr_account_name','"SET-IN-ADMIN"');

-- ---------- helpers ----------
create function is_admin() returns boolean language sql security definer stable
set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

-- New auth user -> profile. Role is NEVER taken from client metadata beyond reader/author/publisher.
create function handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$
declare r user_role := 'reader';
begin
  if new.raw_user_meta_data->>'role' in ('author','publisher') then
    r := (new.raw_user_meta_data->>'role')::user_role;
  end if;
  insert into profiles(id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email, r);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Block self-escalation of role/status through any client path.
create function guard_profile_update() returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if not is_admin() and (new.role <> old.role or new.status <> old.status) then
    raise exception 'role/status can only be changed by an administrator';
  end if;
  return new;
end $$;
create trigger profiles_guard before update on profiles
  for each row execute function guard_profile_update();

-- ---------- atomic payment approval (the only path that grants access) ----------
create function approve_payment(p_payment_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pay payments; ord orders; it record; pct numeric; c numeric; n numeric;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select * into pay from payments where id = p_payment_id for update;
  if pay.status not in ('submitted','needs_info') then raise exception 'payment not reviewable'; end if;
  select * into ord from orders where id = pay.order_id for update;
  if pay.amount_etb <> ord.total_etb then raise exception 'amount mismatch: expected %', ord.total_etb; end if;

  update payments set status='approved', reviewed_by=auth.uid(), reviewed_at=now() where id=pay.id;
  update orders set status='paid' where id=ord.id;

  insert into libraries(user_id, book_id, order_id)
    select ord.user_id, book_id, ord.id from order_items where order_id = ord.id
    on conflict do nothing;   -- gift flow: resolve recipient to a user id before this step in the API layer

  insert into transactions(order_id,payment_id,kind,amount_etb) values (ord.id,pay.id,'sale',ord.total_etb);

  for it in select oi.id, oi.price_etb, b.author_id from order_items oi join books b on b.id=oi.book_id where oi.order_id=ord.id loop
    select coalesce(ap.commission_override_pct, (select (value#>>'{}')::numeric from platform_settings where key='commission_pct'))
      into pct from author_profiles ap where ap.user_id = it.author_id;
    c := round(it.price_etb * pct / 100, 2); n := it.price_etb - c;
    insert into author_earnings(author_id,order_item_id,gross_etb,commission_pct,commission_etb,net_etb)
      values (it.author_id,it.id,it.price_etb,pct,c,n);
    update author_profiles set available_balance_etb = available_balance_etb + n where user_id = it.author_id;
    insert into transactions(order_id,payment_id,kind,amount_etb) values
      (ord.id,pay.id,'commission',c),(ord.id,pay.id,'author_earning',n);
  end loop;

  insert into notifications(user_id,kind,message) values (ord.user_id,'payment_approved','Your payment was verified. Your books are now in your library.');
  insert into admin_logs(admin_id,action,target_type,target_id,detail)
    values (auth.uid(),'payment_approved','payment',pay.id::text,jsonb_build_object('order',ord.order_number,'reference',pay.reference_no));
end $$;

create function reject_payment(p_payment_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare pay payments; ord orders;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_reason),'') = '' then raise exception 'a reason is required'; end if;
  select * into pay from payments where id = p_payment_id for update;
  if pay.status not in ('submitted','needs_info') then raise exception 'payment not reviewable'; end if;
  update payments set status='rejected', reviewer_note=p_reason, reviewed_by=auth.uid(), reviewed_at=now() where id=pay.id;
  update orders set status='rejected' where id=pay.order_id returning * into ord;
  insert into notifications(user_id,kind,message) values (ord.user_id,'payment_rejected','Payment rejected: '||p_reason||'. You may submit a new receipt.');
  insert into admin_logs(admin_id,action,target_type,target_id,detail)
    values (auth.uid(),'payment_rejected','payment',pay.id::text,jsonb_build_object('reason',p_reason));
end $$;

-- ---------- Row Level Security ----------
do $$ declare t text; begin
  foreach t in array array['profiles','author_profiles','publishers','categories','books','book_categories','book_files',
    'coupons','orders','order_items','coupon_redemptions','payments','payment_screenshots','transactions','author_earnings',
    'withdrawal_requests','libraries','reading_progress','bookmarks','reviews','wishlists','notifications','admin_logs','platform_settings']
  loop execute format('alter table %I enable row level security', t); end loop; end $$;

-- Public catalogue
create policy cat_read on categories for select using (true);
create policy bc_read on book_categories for select using (true);
create policy books_public on books for select using (status='approved' or author_id=auth.uid() or is_admin());
create policy books_author_insert on books for insert with check (author_id=auth.uid() and status='pending_review');
create policy books_author_update on books for update using (author_id=auth.uid() and status in ('draft','pending_review','rejected'))
  with check (author_id=auth.uid() and status in ('draft','pending_review'));
create policy books_admin on books for all using (is_admin()) with check (is_admin());
create policy bf_author on book_files for select using (exists(select 1 from books b where b.id=book_id and b.author_id=auth.uid()) or is_admin());
create policy bf_author_w on book_files for insert with check (exists(select 1 from books b where b.id=book_id and b.author_id=auth.uid()));

-- Own data
create policy prof_self on profiles for select using (id=auth.uid() or is_admin());
create policy prof_upd on profiles for update using (id=auth.uid() or is_admin());
create policy ap_read on author_profiles for select using (true);
create policy ap_self on author_profiles for update using (user_id=auth.uid() and approved) with check (user_id=auth.uid());
create policy ap_admin on author_profiles for all using (is_admin()) with check (is_admin());
create policy orders_own on orders for select using (user_id=auth.uid() or is_admin());
create policy oi_own on order_items for select using (exists(select 1 from orders o where o.id=order_id and (o.user_id=auth.uid() or is_admin())));
create policy pay_own on payments for select using (exists(select 1 from orders o where o.id=order_id and o.user_id=auth.uid()) or is_admin());
create policy shots_admin on payment_screenshots for select using (is_admin());   -- customers upload via API; never read back
create policy tx_admin on transactions for select using (is_admin());
create policy earn_own on author_earnings for select using (author_id=auth.uid() or is_admin());
create policy wd_own on withdrawal_requests for select using (author_id=auth.uid() or is_admin());
create policy wd_insert on withdrawal_requests for insert with check (author_id=auth.uid() and status='pending');
create policy wd_admin on withdrawal_requests for update using (is_admin());
create policy lib_own on libraries for select using (user_id=auth.uid() or is_admin());
create policy rp_own on reading_progress for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy bm_own on bookmarks for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy rev_read on reviews for select using (true);
create policy rev_own on reviews for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy wl_own on wishlists for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy notif_own on notifications for select using (user_id=auth.uid());
create policy notif_read on notifications for update using (user_id=auth.uid());
create policy logs_admin on admin_logs for select using (is_admin());
create policy settings_admin on platform_settings for all using (is_admin()) with check (is_admin());
create policy coupons_admin on coupons for all using (is_admin()) with check (is_admin());

-- Order creation, payment submission, withdrawal balance checks and signed download URLs
-- go through server-side API routes using the service role (Stage 2/3), never the browser.
-- Storage buckets to create: book-covers (public), book-files (private), payment-proofs (private, admin-only).
