/** Status options for program records in the admin UI */
export const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Open", value: "open" },
  { label: "Waitlist", value: "waitlist" },
  { label: "Reserved", value: "reserved" },
  { label: "Funded", value: "funded" },
  { label: "Closed", value: "closed" },
  { label: "Coming Soon", value: "coming_soon" },
];

/**
 * Formats a numeric value as USD currency string.
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$ 1,000")
 */
export const CURRENCY_FORMATTER = (value: number | string | undefined): string =>
  `$ ${Number.isFinite(Number(value)) ? Number(value).toLocaleString() : "0"}`;
