import { Icons } from "@v1/ui/icons";

/** The places people come to Derby for; always one tap away. */
export const PRIMARY_PATHS = [
  {
    path: "/",
    label: "sidebar.leaderboard",
    Icon: Icons.Leaderboard,
    seasonScoped: true,
  },
  {
    path: "/matches",
    label: "sidebar.matchHistory",
    Icon: Icons.Matches,
    seasonScoped: true,
  },
  {
    path: "/hof",
    label: "sidebar.hallOfFame",
    Icon: Icons.HOF,
    seasonScoped: true,
  },
] as const;

/** Pre-game tools, grouped under one menu. */
export const TOOL_PATHS = [
  {
    path: "/shuffle",
    label: "sidebar.shuffle",
    Icon: Icons.RandomTeams,
    seasonScoped: false,
  },
  {
    path: "/auctions",
    label: "sidebar.auctions",
    Icon: Icons.Auction,
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
