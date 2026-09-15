import { Icons } from "@v1/ui/icons";

export const PATHS = [
  {
    path: "/",
    label: "sidebar.leaderboard",
    Icon: Icons.Leaderboard,
    seasonScoped: true,
  },
  {
    path: "/matches",
    label: "sidebar.matchHistory",
    Icon: Icons.Calendar,
    seasonScoped: true,
  },
  {
    path: "/hof",
    label: "sidebar.hallOfFame",
    Icon: Icons.HOF,
    seasonScoped: true,
  },
  {
    path: "/duos",
    label: "sidebar.duos",
    Icon: Icons.Users2,
    seasonScoped: true,
  },
  {
    path: "/posts",
    label: "sidebar.posts",
    Icon: Icons.MessageSquare,
    seasonScoped: false,
  },
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
