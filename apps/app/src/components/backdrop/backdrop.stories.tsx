import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BackdropPortraits } from "./backdrop";

/**
 * The backdrop behind every dashboard page. The standings come from tRPC in the app, so the story
 * draws the portraits for a fixed list. It needs a window at least 1280 px wide to look like the
 * app, where a gutter exists beside the content column; narrower, the portrait fades under it.
 * The art is Riot's, loaded from Data Dragon, so the story needs a connection.
 */
const meta = {
  title: "Backdrop",
  component: BackdropPortraits,
  parameters: { layout: "fullscreen" },
  args: {
    portraits: [
      {
        championId: "Viego",
        championName: "Viego",
        playerName: "Kestrel",
        position: 1,
      },
      {
        championId: "Rakan",
        championName: "Rakan",
        playerName: "Old Tom",
        position: 2,
      },
      {
        championId: "Aphelios",
        championName: "Aphelios",
        playerName: "Nightjar",
        position: 3,
      },
    ],
  },
} satisfies Meta<typeof BackdropPortraits>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The top three's mains taking turns: right, then left, then right again. */
export const Default: Story = {};

/**
 * A season with no standings yet shows five well-known champions instead, captioned with the
 * champion alone.
 */
export const NoStandings: Story = {
  args: {
    portraits: [
      {
        championId: "Jhin",
        championName: "Jhin",
        playerName: null,
        position: null,
      },
      {
        championId: "Ahri",
        championName: "Ahri",
        playerName: null,
        position: null,
      },
    ],
  },
};
