"use client";

import { TopBar as TopBarView } from "@v1/ui/recipes/dashboard/top-bar";
import { AccountMenu } from "./account-menu";
import { SeasonSelector } from "./season-selector";
import { useNavItems } from "./use-nav-items";

/** The dashboard's bar on wide screens, with the season picker and account menu on the right. */
export function TopBar() {
  const { homeHref, primary, tools, forum } = useNavItems();

  return (
    <TopBarView
      homeHref={homeHref}
      logoSrc="/jasper.jpg"
      primary={primary}
      tools={tools}
      forum={forum}
      actions={
        <>
          <SeasonSelector />
          <AccountMenu />
        </>
      }
    />
  );
}
