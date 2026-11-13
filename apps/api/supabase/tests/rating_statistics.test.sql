begin;

create extension if not exists pgtap with schema extensions;

-- Statistics nothing reads are not kept on a rating track. Hall of Fame counts multi-kills from the
-- matches themselves.
select plan(6);

select hasnt_column('public', 'ratings', 'total_penta_kills', 'pentakills are counted from matches, not kept on a track');
select hasnt_column('public', 'ratings', 'total_quadra_kills', 'quadrakills are counted from matches, not kept on a track');
select hasnt_column('public', 'ratings', 'total_triple_kills', 'triple kills are counted from matches, not kept on a track');
select hasnt_column('public', 'ratings', 'avg_damage_taken', 'nothing reads average damage taken');
select hasnt_column('public', 'ratings', 'avg_neutral_minions', 'nothing reads average neutral minions');
select hasnt_column('public', 'ratings', 'avg_gold_spent', 'nothing reads average gold spent');

select * from finish();
rollback;
