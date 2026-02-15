import type { LcuMatchDetails } from "./lcu-types.js";

export interface TransformResult {
  matchRow: Record<string, unknown>;
  teams: Record<string, unknown>[];
  players: Record<string, unknown>[];
  participants: Record<string, unknown>[];
}

export function transformMatch(match: LcuMatchDetails): TransformResult | null {
  if (
    match.gameType !== "CUSTOM_GAME" ||
    match.participants.length !== 10 ||
    match.gameDuration < 300
  ) {
    return null;
  }

  const matchRow = {
    match_id: match.gameId,
    platform_id: match.platformId,
    game_creation: new Date(match.gameCreation),
    duration: match.gameDuration,
    game_mode: match.gameMode,
    game_type: match.gameType,
    queue_id: match.queueId,
    map_id: match.mapId,
    patch: match.gameVersion,
    season_id: match.seasonId,
    end_of_game_result: match.endOfGameResult,
    raw_json: match,
  };

  const teams = match.teams.map((team) => ({
    match_id: match.gameId,
    team_id: team.teamId,
    win: team.win === "Win",
    baron_kills: team.baronKills,
    dragon_kills: team.dragonKills,
    rift_herald_kills: team.riftHeraldKills,
    inhibitor_kills: team.inhibitorKills,
    tower_kills: team.towerKills,
    first_baron: team.firstBaron,
    first_blood: team.firstBlood,
    first_tower: team.firstTower,
  }));

  const players: Record<string, unknown>[] = [];
  const participants: Record<string, unknown>[] = [];

  for (const identity of match.participantIdentities) {
    const participant = match.participants.find(
      (p) => p.participantId === identity.participantId,
    );
    if (!participant) continue;

    const stats = participant.stats;

    players.push({
      puuid: identity.player.puuid,
      game_name: identity.player.gameName,
      tag_line: identity.player.tagLine,
      profile_icon: identity.player.profileIcon,
      platform_id: identity.player.platformId,
      last_seen_at: new Date(),
    });

    participants.push({
      match_id: match.gameId,
      puuid: identity.player.puuid,
      participant_id: participant.participantId,
      team_id: participant.teamId,
      champion_id: participant.championId,
      spell1_id: participant.spell1Id,
      spell2_id: participant.spell2Id,
      champ_level: stats.champLevel,

      kills: stats.kills,
      deaths: stats.deaths,
      assists: stats.assists,

      double_kills: stats.doubleKills,
      triple_kills: stats.tripleKills,
      quadra_kills: stats.quadraKills,
      penta_kills: stats.pentaKills,

      largest_killing_spree: stats.largestKillingSpree,
      largest_multi_kill: stats.largestMultiKill,

      total_damage_dealt: stats.totalDamageDealt,
      total_damage_dealt_to_champions: stats.totalDamageDealtToChampions,
      total_damage_taken: stats.totalDamageTaken,
      damage_self_mitigated: stats.damageSelfMitigated,

      physical_damage_dealt: stats.physicalDamageDealt,
      magic_damage_dealt: stats.magicDamageDealt,
      true_damage_dealt: stats.trueDamageDealt,

      gold_earned: stats.goldEarned,
      gold_spent: stats.goldSpent,

      total_minions_killed: stats.totalMinionsKilled,
      neutral_minions_killed: stats.neutralMinionsKilled,

      vision_score: stats.visionScore,
      wards_placed: stats.wardsPlaced,
      wards_killed: stats.wardsKilled,

      turret_kills: stats.turretKills,
      inhibitor_kills: stats.inhibitorKills,

      total_heal: stats.totalHeal,
      total_time_cc_dealt: stats.totalTimeCrowdControlDealt,
      time_ccing_others: stats.timeCCingOthers,

      perk_primary_style: stats.perkPrimaryStyle,
      perk_sub_style: stats.perkSubStyle,

      lane: participant.timeline.lane,
      role: participant.timeline.role,

      win: stats.win,
    });
  }

  return { matchRow, teams, players, participants };
}
