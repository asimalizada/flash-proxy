/**
 * Date and number formatting helpers shared across plan UI components.
 */

export function formatDate(value?: string | null): string {
  if (!value) {
    return "No expiry";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return "--";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatNumber(value?: number | null, suffix?: string): string {
  if (typeof value !== "number") {
    return "--";
  }

  return suffix ? `${value} ${suffix}` : String(value);
}

export function formatPeriod(start?: string, end?: string): string {
  const formattedStart = formatDate(start);
  const formattedEnd = formatDate(end);

  if (formattedStart === "--" || formattedEnd === "--") {
    return "Current period";
  }

  return `${formattedStart} – ${formattedEnd}`;
}
