import type en from "./en";
import type { Strings } from "./format";

/** The same keys as `en.ts`; a key missing or extra here fails typecheck. */
export default {} satisfies Strings<typeof en>;
