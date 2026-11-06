import { NextResponse } from "next/server";
import { getOpenAI, missingKeyResponse } from "@/lib/openai";

export async function POST(request: Request) {
  const client = getOpenAI();
  if (!client) return missingKeyResponse();

  try {
    const { dish } = await request.json();

    if (!dish?.dish) {
      return NextResponse.json({ error: "Missing dish." }, { status: 400 });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You create concise recipe search queries (2-5 words) for a recipe search engine. Return only the search query, no quotes or explanation.",
        },
        {
          role: "user",
          content: `Create a recipe search query for this dish:
Dish: ${dish.dish}
Cuisine: ${dish.cuisine || ""}
Tags: ${(dish.tags || []).join(", ")}
Notes: ${dish.notes || ""}`,
        },
      ],
    });

    const query = response.output_text.trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ query });
  } catch (error) {
    console.error("AI recipe query error:", error);
    return NextResponse.json(
      { error: "Failed to generate a smarter search. Please try again." },
      { status: 500 }
    );
  }
}
