-- Removing a match, two unused indexes and one missing, and NOT NULL where the data never is null.
--
-- Removing a match: `rating_history.match_id` blocked deleting a rated match. It now cascades, and the
-- rating tracks of every removed match are recounted in the order played, so the standings read as if
-- the match was never played. A player whose only match on a track is removed leaves its standings.
-- Uploading the match again brings it back and counts it again.
--
-- Indexes: `idx_matches_patch` had no scans in production, and `idx_participants_match` repeats the
-- leading column of the primary key `(match_id, puuid)`. A post's comments, read by post and in order,
-- had no index.
--
-- NOT NULL: only the rating functions write `ratings` and `rating_history`, never Derby Sync, so these
-- can be tightened (CLAUDE.md keeps the columns clients write as they are).

-- Removing a match ------------------------------------------------------------------------------

alter table public.rating_history
  drop constraint rating_history_match_id_fkey,
  add constraint rating_history_match_id_fkey
    foreign key (match_id) references public.matches (match_id) on delete cascade;

create function public.trg_recount_after_match_removal()
returns trigger
language plpgsql
as $$
declare
  v_track integer;
begin
  for v_track in
    select track
    from (
      select distinct ladder_season_id as track from removed_matches where ladder_season_id is not null
      union
      select 0 where exists (select 1 from removed_matches where ladder_season_id is not null)
    ) tracks
    order by track = 0, track
  loop
    perform replay_rating_track(v_track);
  end loop;

  return null;
end;
$$;

create trigger trg_recount_after_match_removal
  after delete on public.matches
  referencing old table as removed_matches
  for each statement
  execute function public.trg_recount_after_match_removal();

revoke all on function public.trg_recount_after_match_removal() from public, anon, authenticated;
grant execute on function public.trg_recount_after_match_removal() to service_role;

-- Indexes ----------------------------------------------------------------------------------------

drop index if exists public.idx_matches_patch;
drop index if exists public.idx_participants_match;

create index if not exists idx_forum_comments_post_created
  on public.forum_comments (post_id, created_at);

-- NOT NULL ---------------------------------------------------------------------------------------

update public.ratings
set
  rating = coalesce(rating, 1000),
  wins = coalesce(wins, 0),
  losses = coalesce(losses, 0),
  best_streak = coalesce(best_streak, 0),
  win_streak = coalesce(win_streak, 0),
  lose_streak = coalesce(lose_streak, 0)
where rating is null or wins is null or losses is null
   or best_streak is null or win_streak is null or lose_streak is null;

alter table public.ratings
  alter column rating set not null,
  alter column wins set not null,
  alter column losses set not null,
  alter column best_streak set not null,
  alter column win_streak set not null,
  alter column lose_streak set not null;

update public.rating_history
set
  wins = coalesce(wins, 0),
  losses = coalesce(losses, 0),
  best_streak = coalesce(best_streak, 0),
  win_streak = coalesce(win_streak, 0),
  lose_streak = coalesce(lose_streak, 0),
  mvp_games = coalesce(mvp_games, 0),
  ace_games = coalesce(ace_games, 0)
where wins is null or losses is null or best_streak is null or win_streak is null
   or lose_streak is null or mvp_games is null or ace_games is null;

alter table public.rating_history
  alter column rating_after set not null,
  alter column wins set not null,
  alter column losses set not null,
  alter column best_streak set not null,
  alter column win_streak set not null,
  alter column lose_streak set not null,
  alter column mvp_games set not null,
  alter column ace_games set not null;
