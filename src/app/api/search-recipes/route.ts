import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Recipe search isn't configured (missing SPOONACULAR_API_KEY)." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);

  const spoonacularUrl = new URL(
    "https://api.spoonacular.com/recipes/complexSearch"
  );
  spoonacularUrl.searchParams.set("apiKey", apiKey);
  spoonacularUrl.searchParams.set("number", "9");
  spoonacularUrl.searchParams.set("addRecipeInformation", "true");
  spoonacularUrl.searchParams.set("instructionsRequired", "true");

  for (const param of ["query", "cuisine", "diet", "maxReadyTime"]) {
    const value = searchParams.get(param)?.trim();
    if (value) spoonacularUrl.searchParams.set(param, value);
  }

  try {
    const response = await fetch(spoonacularUrl.toString());

    if (!response.ok) {
      const message =
        response.status === 402
          ? "Daily recipe search limit reached. Please try again tomorrow."
          : "Recipe search is unavailable right now. Please try again.";
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ results: data.results || [] });
  } catch (error) {
    console.error("Spoonacular error:", error);
    return NextResponse.json(
      { error: "Could not reach the recipe service. Please try again." },
      { status: 502 }
    );
  }
}
