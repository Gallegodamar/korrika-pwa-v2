create or replace function app.change_my_username(
  p_new_username text,
  p_reason text default null,
  p_request_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  out_user_id uuid,
  out_old_username text,
  out_new_username text,
  out_changed_at timestamptz
)
language plpgsql
security definer
set search_path = app, public, auth
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_new_username text := app.normalize_username(p_new_username);
  v_old_username text;
  v_now timestamptz := clock_timestamp();
  v_request_id uuid := coalesce(p_request_id, gen_random_uuid());
begin
  if v_actor_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not app.is_valid_username(v_new_username) then
    raise exception 'invalid_username_format'
      using errcode = '22023',
            detail = 'Use 3-32 chars: a-z, 0-9 y _.';
  end if;

  select h.user_id, h.old_username, h.new_username, h.changed_at
    into out_user_id, out_old_username, out_new_username, out_changed_at
  from app.username_change_history h
  where h.user_id = v_actor_user_id
    and h.request_id = v_request_id;

  if found then
    return next;
    return;
  end if;

  insert into app.user_profiles (user_id, created_by, updated_by)
  values (v_actor_user_id, v_actor_user_id, v_actor_user_id)
  on conflict on constraint user_profiles_pkey do nothing;

  perform 1
  from app.user_profiles up
  where up.user_id = v_actor_user_id
  for update;

  select ur.username
    into v_old_username
  from app.username_registry ur
  where ur.user_id = v_actor_user_id
    and ur.is_current = true
  for update;

  if v_old_username is null then
    raise exception 'current_username_not_found' using errcode = 'P0001';
  end if;

  if v_old_username = v_new_username then
    raise exception 'username_unchanged' using errcode = 'P0001';
  end if;

  update app.username_registry ur
  set is_current = false,
      retired_at = v_now,
      retired_by = v_actor_user_id
  where ur.user_id = v_actor_user_id
    and ur.is_current = true;

  insert into app.username_registry (
    username,
    user_id,
    is_current,
    assigned_at,
    assigned_by,
    source,
    metadata
  )
  values (
    v_new_username,
    v_actor_user_id,
    true,
    v_now,
    v_actor_user_id,
    'self_service',
    coalesce(p_metadata, '{}'::jsonb)
  );

  insert into app.username_change_history (
    user_id,
    old_username,
    new_username,
    changed_at,
    changed_by,
    source,
    reason,
    request_id,
    metadata
  )
  values (
    v_actor_user_id,
    v_old_username,
    v_new_username,
    v_now,
    v_actor_user_id,
    'self_service',
    p_reason,
    v_request_id,
    coalesce(p_metadata, '{}'::jsonb)
  );

  update public.game_results gr
  set player_name = upper(v_new_username)
  where gr.user_id = v_actor_user_id;

  update app.user_profiles up
  set updated_by = v_actor_user_id
  where up.user_id = v_actor_user_id;

  return query
  select
    v_actor_user_id as out_user_id,
    v_old_username as out_old_username,
    v_new_username as out_new_username,
    v_now as out_changed_at;

exception
  when unique_violation then
    raise exception 'username_already_taken'
      using errcode = '23505',
            detail = 'El username ya esta asignado o reservado historicamente.';
end;
$$;

create or replace function app.admin_list_users(
  p_search text default null,
  p_limit integer default 50
)
returns table (
  user_id uuid,
  current_username text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  previous_usernames text[],
  rename_count bigint,
  self_service_change_count bigint,
  admin_change_count bigint,
  played_days bigint,
  total_points bigint,
  last_played_at timestamptz
)
language plpgsql
security definer
set search_path = app, public, auth
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_search text := nullif(app.normalize_username(p_search), '');
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 200));
begin
  if v_actor_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not app.is_admin(v_actor_user_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  with current_names as (
    select ur.user_id, ur.username
    from app.username_registry ur
    where ur.is_current = true
  ),
  rename_stats as (
    select
      h.user_id,
      count(*)::bigint as rename_count,
      count(*) filter (where h.source = 'self_service')::bigint as self_service_change_count,
      count(*) filter (where h.source <> 'self_service')::bigint as admin_change_count
    from app.username_change_history h
    group by h.user_id
  ),
  game_stats as (
    select
      gr.user_id,
      count(distinct gr.day_index) filter (
        where gr.play_mode = 'DAILY'
          and gr.day_index is not null
      )::bigint as played_days,
      coalesce(sum(gr.correct_answers), 0)::bigint as total_points,
      max(gr.played_at) as last_played_at
    from public.game_results gr
    group by gr.user_id
  )
  select
    up.user_id,
    cn.username as current_username,
    up.status,
    up.created_at,
    up.updated_at,
    coalesce(prev.previous_usernames, '{}'::text[]) as previous_usernames,
    coalesce(rs.rename_count, 0)::bigint as rename_count,
    coalesce(rs.self_service_change_count, 0)::bigint as self_service_change_count,
    coalesce(rs.admin_change_count, 0)::bigint as admin_change_count,
    coalesce(gs.played_days, 0)::bigint as played_days,
    coalesce(gs.total_points, 0)::bigint as total_points,
    gs.last_played_at
  from app.user_profiles up
  join current_names cn
    on cn.user_id = up.user_id
  left join rename_stats rs
    on rs.user_id = up.user_id
  left join game_stats gs
    on gs.user_id = up.user_id
  left join lateral (
    select array_agg(r.username order by r.assigned_at desc) as previous_usernames
    from app.username_registry r
    where r.user_id = up.user_id
      and r.is_current = false
  ) prev
    on true
  where v_search is null
    or cn.username like ('%' || v_search || '%')
    or exists (
      select 1
      from app.username_registry sr
      where sr.user_id = up.user_id
        and sr.username like ('%' || v_search || '%')
    )
  order by coalesce(gs.last_played_at, up.updated_at, up.created_at) desc, cn.username asc
  limit v_limit;
end;
$$;

create or replace function app.admin_change_username(
  p_user_id uuid,
  p_new_username text,
  p_reason text default null,
  p_request_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (
  out_user_id uuid,
  out_old_username text,
  out_new_username text,
  out_changed_at timestamptz
)
language plpgsql
security definer
set search_path = app, public, auth
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_new_username text := app.normalize_username(p_new_username);
  v_old_username text;
  v_now timestamptz := clock_timestamp();
  v_request_id uuid := coalesce(p_request_id, gen_random_uuid());
begin
  if v_actor_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not app.is_admin(v_actor_user_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'target_user_not_found' using errcode = 'P0001';
  end if;

  if p_user_id = v_actor_user_id then
    raise exception 'use_change_my_username_for_self' using errcode = '22023';
  end if;

  if not app.is_valid_username(v_new_username) then
    raise exception 'invalid_username_format'
      using errcode = '22023',
            detail = 'Use 3-32 chars: a-z, 0-9 y _.';
  end if;

  select h.user_id, h.old_username, h.new_username, h.changed_at
    into out_user_id, out_old_username, out_new_username, out_changed_at
  from app.username_change_history h
  where h.user_id = p_user_id
    and h.request_id = v_request_id;

  if found then
    return next;
    return;
  end if;

  perform 1
  from app.user_profiles up
  where up.user_id = p_user_id
  for update;

  if not found then
    raise exception 'target_user_not_found' using errcode = 'P0001';
  end if;

  select ur.username
    into v_old_username
  from app.username_registry ur
  where ur.user_id = p_user_id
    and ur.is_current = true
  for update;

  if v_old_username is null then
    raise exception 'current_username_not_found' using errcode = 'P0001';
  end if;

  if v_old_username = v_new_username then
    raise exception 'username_unchanged' using errcode = 'P0001';
  end if;

  update app.username_registry ur
  set is_current = false,
      retired_at = v_now,
      retired_by = v_actor_user_id
  where ur.user_id = p_user_id
    and ur.is_current = true;

  insert into app.username_registry (
    username,
    user_id,
    is_current,
    assigned_at,
    assigned_by,
    source,
    metadata
  )
  values (
    v_new_username,
    p_user_id,
    true,
    v_now,
    v_actor_user_id,
    'admin_panel',
    coalesce(p_metadata, '{}'::jsonb)
  );

  insert into app.username_change_history (
    user_id,
    old_username,
    new_username,
    changed_at,
    changed_by,
    source,
    reason,
    request_id,
    metadata
  )
  values (
    p_user_id,
    v_old_username,
    v_new_username,
    v_now,
    v_actor_user_id,
    'admin_panel',
    p_reason,
    v_request_id,
    coalesce(p_metadata, '{}'::jsonb)
  );

  update public.game_results gr
  set player_name = upper(v_new_username)
  where gr.user_id = p_user_id;

  update app.user_profiles up
  set updated_by = v_actor_user_id
  where up.user_id = p_user_id;

  return query
  select
    p_user_id as out_user_id,
    v_old_username as out_old_username,
    v_new_username as out_new_username,
    v_now as out_changed_at;

exception
  when unique_violation then
    raise exception 'username_already_taken'
      using errcode = '23505',
            detail = 'El username ya esta asignado o reservado historicamente.';
end;
$$;

create or replace function app.admin_clear_user_game_results(
  p_user_id uuid,
  p_day_index integer default null
)
returns table (
  deleted_rows integer
)
language plpgsql
security definer
set search_path = app, public, auth
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_deleted_rows integer := 0;
begin
  if v_actor_user_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not app.is_admin(v_actor_user_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_user_id is null then
    raise exception 'target_user_not_found' using errcode = 'P0001';
  end if;

  if p_user_id = v_actor_user_id then
    raise exception 'cannot_clear_own_results_from_admin' using errcode = '22023';
  end if;

  if p_day_index is not null and (p_day_index < 0 or p_day_index > 10) then
    raise exception 'invalid_day_index' using errcode = '22023';
  end if;

  if p_day_index is null then
    delete from public.game_results gr
    where gr.user_id = p_user_id;
  else
    delete from public.game_results gr
    where gr.user_id = p_user_id
      and gr.play_mode = 'DAILY'
      and gr.day_index = p_day_index;
  end if;

  get diagnostics v_deleted_rows = row_count;

  return query
  select v_deleted_rows;
end;
$$;

grant execute on function app.change_my_username(text, text, uuid, jsonb) to authenticated;
grant execute on function app.admin_list_users(text, integer) to authenticated;
grant execute on function app.admin_change_username(uuid, text, text, uuid, jsonb) to authenticated;
grant execute on function app.admin_clear_user_game_results(uuid, integer) to authenticated;
