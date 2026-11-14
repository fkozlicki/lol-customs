-- `matches_played` and `qualified` are generated from `wins` and `losses`, which are NOT NULL, through
-- expressions that coalesce their inputs, so neither can be null. Saying so lets the type generator
-- type them as non-null, and a future change to `is_qualified` that could return null fails here.
alter table public.ratings
  alter column matches_played set not null,
  alter column qualified set not null;
