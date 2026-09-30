/**
 * Accessibility exceptions a story can carry, each with the reason once.
 *
 * An open Radix menu is modal: it hides everything else from assistive technology, its trigger
 * included, and keeps focus inside itself, so the hidden trigger cannot be reached meanwhile. axe
 * still reports the trigger as a focusable element inside an aria-hidden region. A story whose `play`
 * leaves a menu open turns that one rule off; every other rule still runs against the open menu.
 */
export const OPEN_RADIX_MENU = {
  a11y: { config: { rules: [{ id: "aria-hidden-focus", enabled: false }] } },
};
