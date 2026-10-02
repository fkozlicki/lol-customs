import type { LucideIcon } from "../../components/icons";

/** A destination in Derby's navigation; the app decides where it goes and whether it is current. */
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}
