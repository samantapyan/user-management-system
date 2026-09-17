/** Only the sizes the interface offers, so `?size=100000` cannot become state. */
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50] as const;

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

/** Annotated, so a value that is not one of the options above fails to compile. */
export const DEFAULT_PAGE_SIZE: PageSize = 10;
