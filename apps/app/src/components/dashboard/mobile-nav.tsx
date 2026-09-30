"use client";

import { MobileNav as MobileNavView } from "@v1/ui/recipes/dashboard/mobile-nav";
import { useNavItems } from "./use-nav-items";

/** The phone's bottom bar: the primary destinations and the forum as tabs, the tools under "More". */
export function MobileNav() {
  const { primary, tools, forum } = useNavItems();
  return <MobileNavView tabs={[...primary, forum]} more={tools} />;
}
