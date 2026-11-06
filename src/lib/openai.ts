import OpenAI from "openai";
import { NextResponse } from "next/server";

// Create the client per request so a missing key returns a clear error
// instead of crashing the route (or the build) when the module loads.
export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? new OpenAI({ apiKey }) : null;
}

export const missingKeyResponse = () =>
  NextResponse.json(
    { error: "AI features aren't configured (missing OPENAI_API_KEY)." },
    { status: 500 }
  );

type DishInput = {
  restaurant?: string;
  dish?: string;
  cuisine?: string;
  rating?: number;
  tags?: string[];
  notes?: string;
};

// Only send the fields the AI needs, and cap how many dishes we send.
export function compactDishes(dishes: unknown) {
  if (!Array.isArray(dishes)) return [];
  return (dishes as DishInput[]).slice(0, 20).map((dish) => ({
    restaurant: dish.restaurant,
    dish: dish.dish,
    cuisine: dish.cuisine,
    rating: dish.rating,
    tags: dish.tags,
    notes: dish.notes,
  }));
}

// Models sometimes wrap JSON in ```json fences or add a sentence around it.
export function parseJsonFromModel(text: string) {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI returned an unexpected format.");
  }
}
