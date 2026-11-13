-- The auction tick runs only while an auction needs it.
--
-- `auction-tick-every-second` used to run around the clock, and every run left a row in
-- `cron.job_run_details`, which nothing cleared: about 86,400 rows a day, which grew the production
-- database to almost 1 GB around 5 MB of ladder data.
--
-- Now:
--   * The per-second tick exists only while a room is in countdown or active, the two states with
--     deadlines measured in seconds. A trigger schedules it when a room enters one of them, and the
--     tick unschedules itself once none is left. Both take the same lock, so the tick cannot remove
--     itself while a new countdown is being committed.
--   * `auction-housekeeping-every-minute` takes over the slow work: lobbies and auctions idle for
--     30 minutes expire (auctions used to wait 2 hours; every round has a deadline and refreshes the
--     room's activity, so only a stuck auction can reach it), terminal rooms go after 24 hours,
--     the tick is scheduled again if a room needs it and it is missing, and cron run details older
--     than 7 days are deleted.
--   * The run details piled up so far are cleared.

-- Scheduling ------------------------------------------------------------------------------------

-- Serialises scheduling and unscheduling the tick.
create function public._auction_lock_tick_schedule()
returns void
language sql
security definer
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended('public.auction_tick_schedule', 0));
$$;

create function public._auction_ensure_tick()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._auction_lock_tick_schedule();
  if not exists (select 1 from cron.job where jobname = 'auction-tick-every-second') then
    perform cron.schedule('auction-tick-every-second', '1 second', 'select public.auction_tick()');
  end if;
end;
$$;

create function public._auction_tick_on_demand()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public._auction_ensure_tick();
  return null;
end;
$$;

create trigger auction_rooms_tick_on_demand
  after insert or update of status on public.auction_rooms
  for each row
  when (new.status in ('countdown', 'active'))
  execute function public._auction_tick_on_demand();

-- The tick: deadlines only -----------------------------------------------------------------------

create or replace function public.auction_tick()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.auction_rooms%rowtype;
  v_processed integer := 0;
  v_now timestamptz := clock_timestamp();
begin
  if not pg_try_advisory_xact_lock(hashtextextended('public.auction_tick', 0)) then return 0; end if;
  for v_room in
    select * from public.auction_rooms
    where (status = 'countdown' and countdown_ends_at <= v_now)
       or (status = 'active' and phase = 'bidding' and bid_deadline <= v_now)
       or (status = 'active' and phase in ('free_auction', 'sold_pause') and phase_deadline <= v_now)
    order by coalesce(countdown_ends_at, bid_deadline, phase_deadline)
    for update skip locked
    limit 100
  loop
    if v_room.status = 'countdown' then
      if (select count(*) = 2 and bool_and(ready) from public.auction_captains where room_id = v_room.id) then
        perform public._auction_start_locked(v_room.id);
      else
        update public.auction_rooms set status = 'waiting', countdown_ends_at = null,
          state_version = state_version + 1, updated_at = v_now where id = v_room.id;
      end if;
    elsif v_room.phase in ('bidding', 'free_auction') then
      perform public._auction_sell_locked(v_room.id, 'deadline');
    else
      perform public._auction_reveal_next_locked(v_room.id);
    end if;
    v_processed := v_processed + 1;
  end loop;

  perform public._auction_lock_tick_schedule();
  if not exists (select 1 from public.auction_rooms where status in ('countdown', 'active')) then
    perform cron.unschedule(jobid) from cron.job where jobname = 'auction-tick-every-second';
  end if;

  return v_processed;
end;
$$;

-- Housekeeping: the slow work, every minute ------------------------------------------------------

create function public.auction_housekeeping()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.auction_rooms%rowtype;
  v_expired integer := 0;
  v_deleted integer := 0;
  v_now timestamptz := clock_timestamp();
begin
  if not pg_try_advisory_xact_lock(hashtextextended('public.auction_housekeeping', 0)) then return 0; end if;

  for v_room in
    select * from public.auction_rooms
    where status in ('waiting', 'active') and last_activity_at <= v_now - interval '30 minutes'
    order by last_activity_at
    for update skip locked
    limit 100
  loop
    perform public._auction_set_terminal_locked(v_room.id, 'expired');
    insert into public.auction_events(room_id, event_type) values (v_room.id, 'expired');
    v_expired := v_expired + 1;
  end loop;

  with doomed as (
    select id from public.auction_rooms
    where terminal_at <= v_now - interval '24 hours'
    order by terminal_at
    for update skip locked
    limit 100
  )
  delete from public.auction_rooms r using doomed d where r.id = d.id;
  get diagnostics v_deleted = row_count;

  if exists (select 1 from public.auction_rooms where status in ('countdown', 'active')) then
    perform public._auction_ensure_tick();
  end if;

  delete from cron.job_run_details where coalesce(end_time, start_time) < v_now - interval '7 days';

  return v_expired + v_deleted;
end;
$$;

-- Only cron and the trigger reach these.
revoke all on function public._auction_lock_tick_schedule() from public, anon, authenticated;
revoke all on function public._auction_ensure_tick() from public, anon, authenticated;
revoke all on function public._auction_tick_on_demand() from public, anon, authenticated;
revoke all on function public.auction_housekeeping() from public, anon, authenticated;
grant execute on function public.auction_housekeeping() to service_role;

-- Switch over ------------------------------------------------------------------------------------

do $$
begin
  perform cron.unschedule(jobid) from cron.job
  where jobname in ('auction-tick-every-second', 'auction-housekeeping-every-minute');
  perform cron.schedule('auction-housekeeping-every-minute', '* * * * *', 'select public.auction_housekeeping()');
  if exists (select 1 from public.auction_rooms where status in ('countdown', 'active')) then
    perform public._auction_ensure_tick();
  end if;
end;
$$;

truncate cron.job_run_details;
