import { Icons } from "@v1/ui/icons";
import { DerbyIcons } from "@/components/derby-icons";

/** The places people come to Derby for; always one tap away. */
export const PRIMARY_PATHS = [
  {
    path: "/",
    label: "sidebar.leaderboard",
    Icon: DerbyIcons.Leaderboard,
    seasonScoped: true,
  },
  {
    path: "/matches",
    label: "sidebar.matchHistory",
    Icon: DerbyIcons.Matches,
    seasonScoped: true,
  },
  {
    path: "/hof",
    label: "sidebar.hallOfFame",
    Icon: DerbyIcons.HallOfFame,
    seasonScoped: true,
  },
] as const;

/** Pre-game tools, grouped under one menu. */
export const TOOL_PATHS = [
  {
    path: "/shuffle",
    label: "sidebar.shuffle",
    Icon: DerbyIcons.Shuffle,
    seasonScoped: false,
  },
  {
    path: "/auctions",
    label: "sidebar.auctions",
    Icon: DerbyIcons.Auction,
    seasonScoped: false,
  },
] as const;

export const FORUM_PATH = {
  path: "/posts",
  label: "sidebar.posts",
  Icon: Icons.MessageSquare,
  seasonScoped: false,
} as const;

export function isActivePath(pathname: string, path: string): boolean {
  if (path === "/") return pathname === "/";
  return pathname.startsWith(path);
}
