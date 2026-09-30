/** Derby's destinations as the navigation recipes take them, for stories; the app labels them. */
import type { NavItem } from "@v1/ui/recipes/dashboard/nav-item";
import { Icons } from "@v1/ui/recipes/icons";

export const PRIMARY: NavItem[] = [
  { href: "/", label: "Leaderboard", icon: Icons.Leaderboard, active: true },
  { href: "/matches", label: "Matches", icon: Icons.Matches, active: false },
  {
    href: "/hof",
    label: "Hall of Fame",
    icon: Icons.HallOfFame,
    active: false,
  },
];

export const TOOLS: NavItem[] = [
  { href: "/shuffle", label: "Shuffle", icon: Icons.Shuffle, active: false },
  { href: "/auctions", label: "Auctions", icon: Icons.Auction, active: false },
];

export const FORUM: NavItem = {
  href: "/posts",
  label: "Forum",
  icon: Icons.MessageSquare,
  active: false,
};
