import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileIcon } from "./profile-icon";
import { RankCrest } from "./rank-crest";

const meta = {
  title: "Game assets",
  parameters: { layout: "centered" },
} satisfies Meta;

export default meta;

const TIERS = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
  null,
];

/** Every tier, plus `null` for a player with no rank on record. */
export const RankCrests: StoryObj = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      {TIERS.map((tier) => (
        <div key={tier ?? "none"} className="flex flex-col items-center gap-1">
          <RankCrest tier={tier} width={32} height={32} />
          <span className="label-caps">{tier ?? "unranked"}</span>
        </div>
      ))}
    </div>
  ),
};

/**
 * A Riot profile icon, square like every avatar in the app. The fallback shows the name's initials
 * when a player has no icon on record.
 */
export const ProfileIcons: StoryObj = {
  render: () => (
    <div className="flex items-center gap-4">
      <ProfileIcon
        iconId={1151}
        name="Kestrel"
        avatarClassName="size-10 rounded-none"
        fallbackClassName="rounded-none"
      />
      <ProfileIcon
        iconId={null}
        name="Kestrel"
        avatarClassName="size-10 rounded-none"
        fallbackClassName="rounded-none"
      />
    </div>
  ),
};
