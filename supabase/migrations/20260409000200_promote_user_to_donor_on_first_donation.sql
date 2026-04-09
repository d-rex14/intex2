-- Promote linked site accounts from user/member to donor after first donation.
create or replace function public.promote_user_to_donor_from_supporter(p_supporter_id integer)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_supporter_email text;
  v_donor_role_id integer;
begin
  if p_supporter_id is null then
    return;
  end if;

  select s.auth_user_id, lower(nullif(trim(s.email), ''))
  into v_user_id, v_supporter_email
  from public.supporters s
  where s.supporter_id = p_supporter_id;

  if v_user_id is null and v_supporter_email is not null then
    select u.id
    into v_user_id
    from auth.users u
    where lower(u.email) = v_supporter_email
    limit 1;

    if v_user_id is not null then
      update public.supporters
      set auth_user_id = v_user_id
      where supporter_id = p_supporter_id
        and auth_user_id is null;
    end if;
  end if;

  if v_user_id is null then
    return;
  end if;

  -- Keep admin/staff users unchanged.
  if exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = v_user_id
      and lower(r.name) in ('admin', 'staff', 'social_media_rep')
  ) then
    return;
  end if;

  select r.id
  into v_donor_role_id
  from public.roles r
  where lower(r.name) = 'donor'
  limit 1;

  if v_donor_role_id is null then
    return;
  end if;

  if exists (
    select 1 from public.user_roles ur
    where ur.user_id = v_user_id and ur.role_id = v_donor_role_id
  ) then
    return;
  end if;

  -- Remove generic starter roles before assigning donor.
  delete from public.user_roles ur
  using public.roles r
  where ur.role_id = r.id
    and ur.user_id = v_user_id
    and lower(r.name) in ('user', 'member', 'unknown');

  insert into public.user_roles (user_id, role_id)
  values (v_user_id, v_donor_role_id)
  on conflict do nothing;
end;
$$;

drop trigger if exists trg_promote_user_to_donor_on_donation on public.donations;

create trigger trg_promote_user_to_donor_on_donation
after insert on public.donations
for each row
execute function public.promote_user_to_donor_from_supporter(new.supporter_id);

