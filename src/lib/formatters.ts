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