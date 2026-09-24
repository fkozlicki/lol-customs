import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChampionImage } from "./champion-image";
import { ItemImage } from "./item-image";
import { ProfileIcon } from "./profile-icon";
import { RankCrest } from "./rank-crest";
import { SpellImage } from "./spell-image";

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

/**
 * Champion portraits by the numeric id match data carries. Wukong's file is `MonkeyKing.png` and
 * Kai'Sa's is `Kaisa.png`, which is why the generated data keeps the file apart from the name. An id
 * the data does not know — a champion newer than `champions.ts` — gets the placeholder.
 */
export const Champions: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3">
      {[266, 62, 145, 1, 999_999].map((id) => (
        <ChampionImage key={id} championId={id} width={48} height={48} />
      ))}
    </div>
  ),
};

/** Items by id, and an empty slot, which keeps its square so a row of six stays aligned. */
export const Items: StoryObj = {
  render: () => (
    <div className="flex items-center gap-1">
      {[3031, 6672, 3006, 3036, 0, 3363].map((id, i) => (
        <ItemImage key={`${id}-${i}`} itemId={id} width={28} height={28} />
      ))}
    </div>
  ),
};

/** Summoner spells by the numeric id in match data. */
export const Spells: StoryObj = {
  render: () => (
    <div className="flex items-center gap-1">
      {[4, 14, 12, 11, 7, 32].map((id) => (
        <SpellImage key={id} spellId={id} width={24} height={24} />
      ))}
    </div>
  ),
};
