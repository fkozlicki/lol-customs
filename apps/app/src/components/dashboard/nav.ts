import { Icons } from "@v1/ui/icons";

export const PATHS = [
  { path: "/", label: "sidebar.leaderboard", Icon: Icons.Leaderboard },
  { path: "/matches", label: "sidebar.matchHistory", Icon: Icons.Calendar },
  { path: "/hof", label: "sidebar.hallOfFame", Icon: Icons.HOF },
  { path: "/duos", label: "sidebar.duos", Icon: Icons.Users2 },
  { path: "/posts", label: "sidebar.posts", Icon: Icons.MessageSquare },
] as const;
