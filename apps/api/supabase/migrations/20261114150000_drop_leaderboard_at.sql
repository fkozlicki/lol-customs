-- `leaderboard_at` was kept as a wrapper around `standings_at` (20261114140000) while the app that
-- called it was still deployed. The app now calls `standings_at`, and nothing else calls this.
drop function public.leaderboard_at(timestamp with time zone, integer, integer);
