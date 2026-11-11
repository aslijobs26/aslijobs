/**
 * Clarity drops text, images, titles and link targets inside this element.
 * Other attributes, such as aria-label, are still sent as written.
 */
export const CLARITY_MASK = { "data-clarity-mask": "true" } as const;

/** Restores static interface text inside a masked area. Never wrap user data. */
export const CLARITY_UNMASK = { "data-clarity-unmask": "true" } as const;
