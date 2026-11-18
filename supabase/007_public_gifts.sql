-- Stage 7. Run after 006_admin_engage.sql.
-- Public aggregate of paid sales per book (counts only; no buyer data).
create view book_sales as
  select oi.book_id, count(*)::int as sales from order_items oi join orders o on o.id = oi.order_id where o.status = 'paid' group by oi.book_id;
grant select on book_sales to anon, authenticated;

-- Gifts to an email address that has no account yet wait here until that address confirms an account.
create table if not exists pending_gifts (
  id uuid primary key default gen_random_uuid(),
  email text not null, book_id uuid not null references books(id), order_id uuid not null references orders(id),
  claimed boolean not null default false, created_at timestamptz not null default now());
alter table pending_gifts enable row level security;   -- no policies: server/database functions only

create or replace function approve_payment(p_payment_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pay payments; ord orders; it record; pct numeric; c numeric; n numeric; rcpt uuid;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  select * into pay from payments where id = p_payment_id for update;
  if pay.status not in ('submitted','needs_info') then raise exception 'payment not reviewable'; end if;
  select * into ord from orders where id = pay.order_id for update;
  if pay.amount_etb <> ord.total_etb then raise exception 'amount mismatch: expected %', ord.total_etb; end if;
  update payments set status='approved', reviewed_by=auth.uid(), reviewed_at=now() where id=pay.id;
  update orders set status='paid' where id=ord.id;

  if ord.gift_recipient_email is null then rcpt := ord.user_id;
  else select id into rcpt from profiles where lower(email) = lower(ord.gift_recipient_email); end if;
  if rcpt is not null then
    insert into libraries(user_id, book_id, order_id) select rcpt, book_id, ord.id from order_items where order_id = ord.id on conflict do nothing;
    if rcpt <> ord.user_id then insert into notifications(user_id,kind,message) values (rcpt,'gift_received','You received an ebook gift! Find it in My Library.'); end if;
  else
    insert into pending_gifts(email, book_id, order_id) select lower(ord.gift_recipient_email), book_id, ord.id from order_items where order_id = ord.id;
  end if;

  insert into transactions(order_id,payment_id,kind,amount_etb) values (ord.id,pay.id,'sale',ord.total_etb);
  for it in select oi.id, oi.price_etb, b.author_id from order_items oi join books b on b.id=oi.book_id where oi.order_id=ord.id loop
    select coalesce(ap.commission_override_pct, (select (value#>>'{}')::numeric from platform_settings where key='commission_pct'))
      into pct from author_profiles ap where ap.user_id = it.author_id;
    c := round(it.price_etb * pct / 100, 2); n := it.price_etb - c;
    insert into author_earnings(author_id,order_item_id,gross_etb,commission_pct,commission_etb,net_etb) values (it.author_id,it.id,it.price_etb,pct,c,n);
    update author_profiles set available_balance_etb = available_balance_etb + n where user_id = it.author_id;
    insert into transactions(order_id,payment_id,kind,amount_etb) values (ord.id,pay.id,'commission',c),(ord.id,pay.id,'author_earning',n);
  end loop;
  insert into notifications(user_id,kind,message) values (ord.user_id,'payment_approved','Your payment was verified.' || case when ord.gift_recipient_email is null then ' Your books are now in your library.' else ' Your gift has been delivered.' end);
  insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(),'payment_approved','payment',pay.id::text,jsonb_build_object('order',ord.order_number,'reference',pay.reference_no));
end $$;

create or replace function claim_gifts(p_user uuid, p_email text) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into libraries(user_id, book_id, order_id) select p_user, book_id, order_id from pending_gifts where email = lower(p_email) and not claimed on conflict do nothing;
  if found then insert into notifications(user_id,kind,message) values (p_user,'gift_received','You received an ebook gift! Find it in My Library.'); end if;
  update pending_gifts set claimed = true where email = lower(p_email) and not claimed;
end $$;
revoke execute on function claim_gifts(uuid, text) from public, anon, authenticated;
create or replace function claim_gifts_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin perform claim_gifts(new.id, new.email); return new; end $$;
-- Gifts are claimed only once the email address is confirmed. The "zz" name makes this run after the profile-creating trigger.
drop trigger if exists on_auth_user_zz_claim_gifts on auth.users;
create trigger on_auth_user_zz_claim_gifts after insert on auth.users for each row when (new.email_confirmed_at is not null) execute function claim_gifts_trg();
drop trigger if exists on_auth_user_confirmed_gifts on auth.users;
create trigger on_auth_user_confirmed_gifts after update of email_confirmed_at on auth.users for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null) execute function claim_gifts_trg();
