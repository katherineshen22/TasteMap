// Server-only helpers for importing a recipe from a web page.
//
// Most recipe sites embed a schema.org "Recipe" as JSON-LD (it's what Google
// uses for recipe cards), so we parse that. Pages are fetched server-side,
// which means user-supplied URLs must not be able to reach internal services:
// only http(s) to public IP addresses is allowed, redirects are re-checked,
// and responses are size- and time-limited.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { ImportedRecipe } from "@/types/food";

const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 4;

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a === "::" || a === "::1") return true;
    if (a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80")) return true;
    // IPv4-mapped (::ffff:10.0.0.1)
    const mapped = a.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateAddress(mapped[1]) : false;
  }
  const [a, b] = address.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local, incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast + reserved
  );
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ImportError("Only http and https links can be imported.");
  }
  if (url.username || url.password) {
    throw new ImportError("That link isn't supported.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true }).catch(() => {
        throw new ImportError("Couldn't find that website. Check the link.");
      });
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new ImportError("That link isn't supported.");
  }
}

export class ImportError extends Error {
  // True when the URL was valid and public but the site refused or failed,
  // so it's reasonable to try a third-party extractor instead.
  siteFailed: boolean;
  constructor(message: string, siteFailed = false) {
    super(message);
    this.siteFailed = siteFailed;
  }
}

async function fetchPage(startUrl: string) {
  let url: URL;
  try {
    url = new URL(startUrl);
  } catch {
    throw new ImportError("That doesn't look like a valid link.");
  }

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);

    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TasteMapRecipeImporter/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    }).catch(() => {
      throw new ImportError("Couldn't reach that website. Try again later.", true);
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) break;
      url = new URL(location, url);
      continue;
    }

    if (!response.ok) {
      throw new ImportError(
        response.status === 403
          ? "That website blocks automatic imports. Try entering it manually."
          : `That website returned an error (${response.status}).`,
        true
      );
    }

    // Read up to MAX_BYTES so a huge page can't exhaust memory.
    const reader = response.body?.getReader();
    if (!reader) return { html: "", finalUrl: url };
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = new TextDecoder().decode(Buffer.concat(chunks));
    return { html, finalUrl: url };
  }

  throw new ImportError("That link redirects too many times.");
}

// ---------- JSON-LD parsing ----------

type JsonObject = Record<string, unknown>;

const decodeEntities = (text: string) =>
  text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

const clean = (value: unknown) =>
  typeof value === "string"
    ? decodeEntities(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim()
    : "";

function isRecipe(node: JsonObject) {
  const type = node["@type"];
  return Array.isArray(type) ? type.includes("Recipe") : type === "Recipe";
}

// JSON-LD can be a single object, an array, or nested under @graph.
function findRecipe(node: unknown): JsonObject | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item);
      if (found) return found;
    }
    return null;
  }
  if (node && typeof node === "object") {
    const obj = node as JsonObject;
    if (isRecipe(obj)) return obj;
    if (obj["@graph"]) return findRecipe(obj["@graph"]);
  }
  return null;
}

// "PT1H30M" -> 90
function parseDuration(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return null;
  const [, d, h, m] = match.map((part) => Number(part || 0));
  const minutes = d * 1440 + h * 60 + m;
  return minutes > 0 ? minutes : null;
}

// Instructions may be a string, a list of strings, HowToStep objects, or
// HowToSection objects containing steps.
function parseInstructions(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/\n+|(?<=\.)\s+(?=\d+\.\s)/)
      .map((step) => clean(step).replace(/^\d+[.)]\s*/, ""))
      .filter(Boolean);
  }
  if (Array.isArray(value)) return value.flatMap(parseInstructions);
  if (value && typeof value === "object") {
    const obj = value as JsonObject;
    if (obj.itemListElement) return parseInstructions(obj.itemListElement);
    const text = clean(obj.text || obj.name);
    return text ? [text] : [];
  }
  return [];
}

function parseImage(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return parseImage(value[0]);
  if (value && typeof value === "object") {
    return parseImage((value as JsonObject).url);
  }
  return null;
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map(clean).filter(Boolean);
  }
  return [];
}

function parseRecipeFromHtml(html: string, pageUrl: URL): ImportedRecipe | null {
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const [, body] of scripts) {
    let data: unknown;
    try {
      data = JSON.parse(body.trim());
    } catch {
      continue;
    }
    const recipe = findRecipe(data);
    if (!recipe) continue;

    const image = parseImage(recipe.image);
    const yieldValue = Array.isArray(recipe.recipeYield)
      ? recipe.recipeYield[0]
      : recipe.recipeYield;

    return {
      title: clean(recipe.name).slice(0, 200) || "Untitled recipe",
      source_url: pageUrl.toString(),
      image_url: image ? new URL(image, pageUrl).toString() : null,
      cuisine: toList(recipe.recipeCuisine)[0] || null,
      total_minutes:
        parseDuration(recipe.totalTime) ??
        ((parseDuration(recipe.prepTime) ?? 0) +
          (parseDuration(recipe.cookTime) ?? 0) || null),
      servings: yieldValue != null ? clean(String(yieldValue)) || null : null,
      ingredients: toList(recipe.recipeIngredient || recipe.ingredients),
      instructions: parseInstructions(recipe.recipeInstructions),
      tags: [
        ...toList(recipe.recipeCategory),
        ...toList(recipe.keywords),
      ].slice(0, 8),
    };
  }
  return null;
}

// Fallback for pages without JSON-LD: Spoonacular's extractor (uses quota).
async function extractWithSpoonacular(url: string): Promise<ImportedRecipe | null> {
  const apiKey = process.env.SPOONACULAR_API_KEY;
  if (!apiKey) return null;

  const endpoint = new URL("https://api.spoonacular.com/recipes/extract");
  endpoint.searchParams.set("apiKey", apiKey);
  endpoint.searchParams.set("url", url);

  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);
  if (!response?.ok) return null;

  const data = await response.json().catch(() => null);
  if (!data?.title) return null;

  const steps: string[] =
    data.analyzedInstructions?.[0]?.steps?.map((s: { step: string }) => clean(s.step)) ||
    parseInstructions(data.instructions);

  return {
    title: clean(data.title).slice(0, 200),
    source_url: url,
    image_url: data.image || null,
    cuisine: data.cuisines?.[0] || null,
    total_minutes: data.readyInMinutes || null,
    servings: data.servings ? String(data.servings) : null,
    ingredients: (data.extendedIngredients || [])
      .map((i: { original?: string }) => clean(i.original))
      .filter(Boolean),
    instructions: steps.filter(Boolean),
    tags: (data.dishTypes || []).slice(0, 8),
  };
}

export async function importRecipe(url: string): Promise<ImportedRecipe> {
  let page: { html: string; finalUrl: URL };
  try {
    page = await fetchPage(url.trim());
  } catch (error) {
    // The site blocked us or is down: Spoonacular may still be able to read it.
    if (error instanceof ImportError && error.siteFailed) {
      const fallback = await extractWithSpoonacular(url.trim());
      if (fallback && fallback.ingredients.length > 0) return fallback;
    }
    throw error;
  }
  const { html, finalUrl } = page;
  const parsed = parseRecipeFromHtml(html, finalUrl);
  if (parsed && parsed.ingredients.length > 0) return parsed;

  const fallback = await extractWithSpoonacular(finalUrl.toString());
  if (fallback && fallback.ingredients.length > 0) return fallback;
  if (parsed) return parsed;

  throw new ImportError(
    "Couldn't find a recipe on that page. You can still add it by hand."
  );
}
