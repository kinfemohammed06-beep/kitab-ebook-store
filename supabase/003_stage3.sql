-- Stage 3. Run after 002_seed.sql.
insert into storage.buckets (id, name, public) values
  ('book-covers','book-covers',true), ('book-files','book-files',false), ('payment-proofs','payment-proofs',false)
on conflict (id) do nothing;
-- No storage policies on payment-proofs/book-files: only the server (service role) reads or writes them.

create or replace function request_payment_info(p_payment_id uuid, p_message text) returns void
language plpgsql security definer set search_path = public as $$
declare pay payments; uid uuid;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_message),'') = '' then raise exception 'a message is required'; end if;
  select * into pay from payments where id = p_payment_id for update;
  if pay.status <> 'submitted' then raise exception 'payment not reviewable'; end if;
  update payments set status='needs_info', reviewer_note=p_message, reviewed_by=auth.uid(), reviewed_at=now() where id=pay.id;
  select user_id into uid from orders where id = pay.order_id;
  insert into notifications(user_id,kind,message) values (uid,'payment_info_requested','More information needed for your payment: '||p_message);
  insert into admin_logs(admin_id,action,target_type,target_id,detail)
    values (auth.uid(),'payment_info_requested','payment',pay.id::text,jsonb_build_object('message',p_message));
end $$;
-- Coupon codes must be stored UPPERCASE (the app uppercases user input before matching).

create or replace function increment_coupon(p_id uuid) returns void language sql security definer set search_path = public as $$
  update coupons set used_count = used_count + 1 where id = p_id; $$;
revoke execute on function increment_coupon(uuid) from public, anon, authenticated;
