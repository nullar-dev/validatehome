export const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Open", value: "open" },
  { label: "Waitlist", value: "waitlist" },
  { label: "Reserved", value: "reserved" },
  { label: "Funded", value: "funded" },
  { label: "Closed", value: "closed" },
  { label: "Coming Soon", value: "coming_soon" },
];

export const CURRENCY_FORMATTER = (value: number | string | undefined): string =>
  `$ ${Number(value).toLocaleString()}`;
