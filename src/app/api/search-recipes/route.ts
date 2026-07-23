import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing Spoonacular API key" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);

  const query = searchParams.get("query") || "";
  const cuisine = searchParams.get("cuisine") || "";
  const tags = searchParams.get("tags") || "";
  const maxReadyTime = searchParams.get("maxReadyTime") || "";

  const spoonacularUrl = new URL(
    "https://api.spoonacular.com/recipes/complexSearch"
  );

  spoonacularUrl.searchParams.set("apiKey", apiKey);
  spoonacularUrl.searchParams.set("number", "8");
  spoonacularUrl.searchParams.set("addRecipeInformation", "true");
  spoonacularUrl.searchParams.set("instructionsRequired", "true");

  if (query) {
    spoonacularUrl.searchParams.set("query", query);
  }

  if (cuisine) {
    spoonacularUrl.searchParams.set("cuisine", cuisine);
  }

  if (tags) {
    spoonacularUrl.searchParams.set("tags", tags);
  }

  if (maxReadyTime) {
    spoonacularUrl.searchParams.set("maxReadyTime", maxReadyTime);
  }

  const response = await fetch(spoonacularUrl.toString());

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch recipes from Spoonacular" },
      { status: response.status }
    );
  }

  const data = await response.json();

  return NextResponse.json(data);
}