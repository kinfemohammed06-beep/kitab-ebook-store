-- Stage 6. Run after 005_authors.sql.
create policy cat_admin on categories for all using (is_admin()) with check (is_admin());
-- Public, non-sensitive site settings are readable by everyone; everything else stays admin-only.
create policy settings_public on platform_settings for select using (key in ('site_name','contact_email','contact_phone','announcement','terms','privacy'));
insert into platform_settings(key,value) values ('site_name','"Kitab"'),('contact_email','""'),('contact_phone','""'),('announcement','""'),('terms','""'),('privacy','""') on conflict do nothing;

create or replace function admin_set_setting(p_key text, p_value jsonb) returns void language plpgsql security definer set search_path = public as $$
declare old jsonb;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_key not in ('site_name','telebirr_number','telebirr_account_name','commission_pct','min_withdrawal_etb','contact_email','contact_phone','announcement','terms','privacy') then raise exception 'unknown setting'; end if;
  if p_key in ('commission_pct','min_withdrawal_etb') then
    if jsonb_typeof(p_value) <> 'number' then raise exception '% must be a number', p_key; end if;
    if (p_value#>>'{}')::numeric < 0 or (p_key = 'commission_pct' and (p_value#>>'{}')::numeric > 100) then raise exception '% is out of range', p_key; end if;
  end if;
  select value into old from platform_settings where key = p_key;
  if old is not distinct from p_value then return; end if;
  insert into platform_settings(key,value,updated_by,updated_at) values (p_key,p_value,auth.uid(),now())
    on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(),'setting_changed','setting',p_key,
    jsonb_build_object('old', case when p_key in ('terms','privacy') then null else old end, 'new', case when p_key in ('terms','privacy') then null else p_value end));
end $$;

create or replace function admin_set_user(p_user_id uuid, p_role user_role, p_status account_status) returns void language plpgsql security definer set search_path = public as $$
declare o profiles;
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_user_id = auth.uid() and (p_role <> 'admin' or p_status <> 'active') then raise exception 'you cannot demote or suspend yourself'; end if;
  select * into o from profiles where id = p_user_id for update; if not found then raise exception 'user not found'; end if;
  update profiles set role = p_role, status = p_status where id = p_user_id;
  if p_role in ('author','publisher') then insert into author_profiles(user_id, pen_name) values (p_user_id, coalesce(nullif(o.full_name,''),'Author')) on conflict do nothing; end if;
  insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(),'user_changed','user',p_user_id::text,
    jsonb_build_object('role',jsonb_build_array(o.role,p_role),'status',jsonb_build_array(o.status,p_status)));
end $$;

create or replace function admin_create_coupon(p_code text, p_percent numeric, p_fixed numeric, p_expires timestamptz, p_max int) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_code !~ '^[A-Z0-9_-]{3,30}$' then raise exception 'code must be 3-30 letters/digits'; end if;
  if (p_percent is null) = (p_fixed is null) then raise exception 'set either a percentage or a fixed amount'; end if;
  if p_percent is not null and (p_percent < 1 or p_percent > 100) then raise exception 'percentage must be 1-100'; end if;
  insert into coupons(code,percent_off,fixed_off_etb,expires_at,max_uses) values (p_code,p_percent,p_fixed,p_expires,p_max);
  insert into admin_logs(admin_id,action,target_type,target_id,detail) values (auth.uid(),'coupon_created','coupon',p_code,jsonb_build_object('percent',p_percent,'fixed',p_fixed,'expires',p_expires,'max',p_max));
end $$;

create or replace function report_review(p_review_id uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'login required'; end if;
  update reviews set reported = true where id = p_review_id;
end $$;
create or replace function admin_review_action(p_id uuid, p_delete boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'forbidden'; end if;
  if p_delete then delete from reviews where id = p_id; else update reviews set reported = false where id = p_id; end if;
  insert into admin_logs(admin_id,action,target_type,target_id) values (auth.uid(), case when p_delete then 'review_deleted' else 'review_report_dismissed' end,'review',p_id::text);
end $$;
create or replace function guard_review() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated','anon') and not is_admin() and new.reported <> old.reported then raise exception 'not allowed'; end if;
  return new; end $$;
drop trigger if exists reviews_guard on reviews;
create trigger reviews_guard before update on reviews for each row execute function guard_review();

create view author_earning_totals with (security_invoker = true) as
  select e.author_id, a.pen_name, count(*)::int sales, sum(e.gross_etb) gross, sum(e.commission_etb) commission, sum(e.net_etb) net, a.available_balance_etb balance
  from author_earnings e join author_profiles a on a.user_id = e.author_id group by e.author_id, a.pen_name, a.available_balance_etb;
