-- An uploaded match gets its OP scores and its rating once, in that order.
--
-- `trg_compute_op_scores` and `trg_update_ratings` ran for each inserted participant. Derby Sync
-- inserts all ten in one statement, and row triggers fire after the statement, so every one of the
-- ten saw a complete match and computed the OP scores of the whole match again: ten computations
-- per upload where one is needed (about 290 ms of a 314 ms insert). The OP scores also had to exist
-- before the rating read them, and only the alphabetical order of the two trigger names made sure.
--
-- One statement trigger now replaces both. For every match among the inserted participants that has
-- all ten, it computes the OP scores once, then rates the match if it has no rating yet. A repeated
-- upload updates existing participants instead of inserting them, so it recomputes nothing.
--
-- A match counts as complete with exactly ten participants everywhere: OP scores already required ten,
-- rating used to require at least ten.

create function public.trg_rate_uploaded_matches()
returns trigger
language plpgsql
as $$
declare
  v_match_id bigint;
begin
  for v_match_id in
    select m.match_id
    from matches m
    where m.match_id in (select distinct match_id from new_participants)
    order by m.game_creation, m.match_id
  loop
    if (select count(*) from match_participants where match_id = v_match_id) <> 10 then
      continue;
    end if;

    perform compute_op_scores_for_match(v_match_id);

    if not exists (select 1 from rating_history where match_id = v_match_id) then
      perform apply_rating_update_for_match(v_match_id);
    end if;
  end loop;

  return null;
end;
$$;

drop trigger trg_compute_op_scores on public.match_participants;
drop trigger trg_update_ratings on public.match_participants;
drop function public.trg_compute_op_scores();
drop function public.update_ratings_for_match();

create trigger trg_rate_uploaded_matches
  after insert on public.match_participants
  referencing new table as new_participants
  for each statement
  execute function public.trg_rate_uploaded_matches();

revoke all on function public.trg_rate_uploaded_matches() from public, anon, authenticated;
grant execute on function public.trg_rate_uploaded_matches() to service_role;

-- Exactly ten participants, like the trigger.
create or replace function public.apply_rating_update_for_match(p_match_id bigint)
returns void
language plpgsql
as $$
declare
  v_season integer;
begin
  if (select count(*) from match_participants where match_id = p_match_id) <> 10 then
    return;
  end if;

  select ladder_season_id into v_season from matches where match_id = p_match_id;
  if v_season is null then
    return;
  end if;

  perform _rate_match_on_track(p_match_id, v_season);
  perform _rate_match_on_track(p_match_id, 0);
end;
$$;

create or replace function public.replay_rating_track(p_track integer)
returns void
language plpgsql
as $$
declare
  rec record;
begin
  perform pg_advisory_xact_lock(hashtext('rating_track'), p_track);

  delete from rating_history where ladder_season_id = p_track;
  delete from ratings where ladder_season_id = p_track;

  for rec in
    select m.match_id
    from matches m
    join match_participants mp on mp.match_id = m.match_id
    where m.ladder_season_id is not null
      and (p_track = 0 or m.ladder_season_id = p_track)
    group by m.match_id, m.game_creation
    having count(*) = 10
    order by m.game_creation asc, m.match_id asc
  loop
    perform _apply_rating_update_for_track(rec.match_id, p_track);
  end loop;
end;
$$;
