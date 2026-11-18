-- Stage 2 additions. Run after 001_schema.sql.

-- Authors get an (unapproved) author profile on signup.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare r user_role := 'reader';
begin
  if new.raw_user_meta_data->>'role' in ('author','publisher') then r := (new.raw_user_meta_data->>'role')::user_role; end if;
  insert into profiles(id, full_name, email, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.email, r);
  if r = 'author' then insert into author_profiles(user_id, pen_name) values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''),'Author')); end if;
  return new;
end $$;

create or replace view book_ratings with (security_invoker = true) as
  select book_id, round(avg(rating),1) as avg_rating, count(*)::int as review_count from reviews group by book_id;

insert into categories(slug,name_en,name_am) values
 ('ethiopian-literature','Ethiopian Literature','የኢትዮጵያ ሥነ ጽሑፍ'),('fiction','Fiction','ልብ ወለድ'),('history','History','ታሪክ'),
 ('business','Business','ንግድ'),('education','Education','ትምህርት'),('religion','Religion','ሃይማኖት'),
 ('personal-development','Personal Development','ራስን ማሻሻል'),('childrens-books','Children''s Books','የልጆች መጻሕፍት'),('poetry','Poetry','ግጥም')
on conflict (slug) do nothing;

-- DEMO BOOKS: flagged is_sample_data. Requires at least one registered author account
-- (register as Author in the app first). Attaches the demo books to the first author found.
do $$ declare a uuid; b uuid; r record; begin
  select user_id into a from author_profiles order by created_at limit 1;
  if a is null then raise exception 'Register an author account first'; end if;
  update author_profiles set approved = true where user_id = a;
  for r in select * from (values
    ('sample-the-long-road','The Long Road Home (Sample)','A demo listing for layout testing.',250.00,'ethiopian-literature','en'),
    ('sample-coffee-and-trade','Coffee and Trade (Sample)','A demo business title.',320.00,'business','en'),
    ('sample-highland-stories','Highland Stories (Sample)','A demo fiction collection.',180.00,'fiction','en'),
    ('sample-free-primer','A Free Reading Primer (Sample)','A free demo title.',0.00,'education','en'),
    ('sample-night-poems','Night Poems (Sample)','A demo poetry book.',120.00,'poetry','en'),
    ('sample-first-steps','First Steps for Children (Sample)','A demo children''s book.',90.00,'childrens-books','en'),
    ('sample-daily-habits','Daily Habits (Sample)','A demo self-development title.',210.00,'personal-development','en'),
    ('sample-short-history','A Short History (Sample)','A demo history title.',275.00,'history','en')
  ) as t(slug,title,descr,price,cat,lang) loop
    insert into books(slug,title,description,author_id,price_etb,language,status,published_at,is_sample_data)
      values (r.slug,r.title,r.descr,a,r.price,r.lang,'approved',now(),true) on conflict (slug) do nothing returning id into b;
    if b is not null then insert into book_categories select b, id from categories where slug = r.cat; end if;
  end loop;
end $$;
