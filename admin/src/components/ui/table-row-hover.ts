/** Shared hover treatment for Operations list tables. Put `tableRowHover` on the <tr>. */
export const tableRowHover =
  "group/row transition-colors duration-200 hover:bg-primary-light/40";

/** First cell of a hoverable row: shows a primary accent bar on the left edge. */
export const tableRowAccentCell =
  "relative before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-primary before:opacity-0 before:transition-opacity before:duration-200 group-hover/row:before:opacity-100";

/** Row title (company, candidate or job name). */
export const tableRowTitleHover =
  "transition-colors duration-200 group-hover/row:text-primary";

/** Row logo or avatar. */
export const tableRowMediaHover =
  "transition-transform duration-200 group-hover/row:scale-105";
