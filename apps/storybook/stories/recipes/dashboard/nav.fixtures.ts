/** Derby's destinations as the navigation recipes take them, for stories; the app labels them. */

import { Icons } from "@v1/ui/icons";
import type { NavItem } from "@v1/ui/recipes/dashboard/nav-item";

export const PRIMARY: NavItem[] = [
  { href: "/", label: "Standings", icon: Icons.Standings, active: true },
  { href: "/matches", label: "Matches", icon: Icons.Matches, active: false },
  {
    href: "/hof",
    label: "Hall of Fame",
    icon: Icons.HallOfFame,
    active: false,
  },
];

export const TOOLS: NavItem[] = [
  { href: "/draw", label: "Draw", icon: Icons.Draw, active: false },
  { href: "/auctions", label: "Auctions", icon: Icons.Auction, active: false },
];

export const FORUM: NavItem = {
  href: "/posts",
  label: "Forum",
  icon: Icons.MessageSquare,
  active: false,
};
