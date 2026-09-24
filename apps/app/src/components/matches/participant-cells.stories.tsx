import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MATCH, MATCH_VIEW } from "./match.fixtures";
import MatchParticipantCS from "./match-participant-cs";
import MatchParticipantDamage from "./match-participant-damage";
import MatchParticipantInfo from "./match-participant-info";
import MatchParticipantItems from "./match-participant-items";
import MatchParticipantKDA from "./match-participant-kda";
import MatchParticipantScore from "./match-participant-score";
import MatchParticipantWards from "./match-participant-wards";

const v = MATCH_VIEW;
const p = v.mvp;
const ace = v.ace;
const totalKills = (who: typeof p) =>
  who.team_id === 100 ? v.blueKills : v.redKills;

const meta = {
  title: "Matches/Participant cells",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;

type Story = StoryObj;

/** The cells of one scoreboard row, one story each, each fed the numbers the row would pass it. */
export const Info: Story = {
  render: () => <MatchParticipantInfo p={p} rawData={v.rawFor(p)} />,
};

/** Kills / deaths / assists, kill participation, and the ratio. */
export const Kda: Story = {
  render: () => <MatchParticipantKDA p={p} totalKills={totalKills(p)} />,
};

/** The OP score and its rank in the match. The MVP and ACE carry their badge instead of a rank. */
export const Score: Story = {
  render: () => (
    <div className="flex gap-6">
      <MatchParticipantScore p={p} scores={v.scores} />
      <MatchParticipantScore p={ace} scores={v.scores} />
      <MatchParticipantScore
        p={v.participants.find((x) => !x.is_mvp && !x.is_ace) ?? p}
        scores={v.scores}
      />
    </div>
  ),
};

/** Damage dealt and taken, as bars scaled against the highest in the match. */
export const Damage: Story = {
  render: () => (
    <MatchParticipantDamage
      p={p}
      highestDamageDealt={v.highestDamageDealt}
      highestDamageTaken={v.highestDamageTaken}
    />
  ),
};

export const Wards: Story = {
  render: () => <MatchParticipantWards p={p} />,
};

/** Minions and CS per minute. */
export const Cs: Story = {
  render: () => <MatchParticipantCS p={p} duration={MATCH.duration} />,
};

/** Six items and the trinket; an empty slot keeps its square. */
export const Items: Story = {
  render: () => <MatchParticipantItems rawData={v.rawFor(p)} />,
};
