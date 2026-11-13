-- A participant's items as a column of their own.
--
-- The match cards showed each participant's items by reading Riot's whole match JSON, so the match
-- lists sent `raw_json` (about 33 kB) and `timeline_json` (about 93 kB) of every match to the
-- browser for seven numbers per player. The items now live on `match_participants`, and the lists can
-- leave both JSON columns out.
--
-- `item_ids` holds the inventory at the end of the match in slot order, `item0` to `item6`, the
-- trinket last; 0 is an empty slot. It is not the order the items were bought in, which Riot's custom
-- game data does not record.
--
-- Installed Derby Sync clients keep writing the same columns: the trigger derives `item_ids` from the
-- match JSON, which they upload before the participants (ADR 0001).

alter table public.match_participants add column item_ids integer[];

-- The items of one participant, from the match JSON; null when the participant is not in it.
create function public._participant_item_ids(p_match_id bigint, p_participant_id integer)
returns integer[]
language sql
stable
set search_path = ''
as $$
  select array[
    (p->'stats'->>'item0')::int,
    (p->'stats'->>'item1')::int,
    (p->'stats'->>'item2')::int,
    (p->'stats'->>'item3')::int,
    (p->'stats'->>'item4')::int,
    (p->'stats'->>'item5')::int,
    (p->'stats'->>'item6')::int
  ]
  from public.matches m
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(m.raw_json->'participants') = 'array' then m.raw_json->'participants' else '[]'::jsonb end
  ) as p
  where m.match_id = p_match_id
    and (p->>'participantId')::int = p_participant_id
  limit 1;
$$;

create function public.trg_set_participant_item_ids()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.item_ids := public._participant_item_ids(new.match_id, new.participant_id);
  return new;
end;
$$;

create trigger trg_set_participant_item_ids
  before insert or update of match_id, participant_id on public.match_participants
  for each row
  execute function public.trg_set_participant_item_ids();

-- Reached only through the trigger, which runs as Derby Sync's service role.
revoke all on function public._participant_item_ids(bigint, integer) from public, anon, authenticated;
grant execute on function public._participant_item_ids(bigint, integer) to service_role;
revoke all on function public.trg_set_participant_item_ids() from public, anon, authenticated;
grant execute on function public.trg_set_participant_item_ids() to service_role;

-- Every participant already uploaded.
update public.match_participants
set item_ids = public._participant_item_ids(match_id, participant_id);
