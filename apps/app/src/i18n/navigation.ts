import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Next's navigation, aware of the locale; `useRouter().replace(…, { locale })` switches language. */
export const { usePathname, useRouter } = createNavigation(routing);
