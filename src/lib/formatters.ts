export function normalizeText(value: string) {
    return value.trim().toLowerCase();
  }
  
  export function titleCase(value: string) {
    return value
      .trim()
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  
  export function normalizeCuisine(value: string) {
    return titleCase(value);
  }
  
  export function normalizeTag(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("-");
  }
  
  export function normalizeTags(value: string) {
    return value
      .split(",")
      .map((tag) => normalizeTag(tag))
      .filter(Boolean);
  }
export function formatPrice(level?: number | null) {
  return level ? "$".repeat(level) : "";
}

export function formatLocation(dish: {
  city?: string | null;
  neighborhood?: string | null;
}) {
  return [dish.neighborhood, dish.city].filter(Boolean).join(", ");
}

// Parses a "YYYY-MM-DD" date as a local date (not UTC midnight, which
// can show up as the previous day in US time zones).
export function formatVisitDate(value?: string | null) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function googleMapsUrl(dish: {
  restaurant: string;
  neighborhood?: string | null;
  city?: string | null;
}) {
  const query = [dish.restaurant, dish.neighborhood, dish.city]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function uniqueSorted(values: (string | null | undefined)[]) {
  return [...new Set(values.map((v) => v?.trim()).filter(Boolean) as string[])]
    .sort((a, b) => a.localeCompare(b));
}

// Only allow http(s) links from user/imported data (blocks javascript: URLs).
export function safeHttpUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function formatMinutes(minutes?: number | null) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} hr${m ? ` ${m} min` : ""}` : `${m} min`;
}
