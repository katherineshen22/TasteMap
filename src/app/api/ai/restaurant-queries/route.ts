import { NextResponse } from "next/server";
import {
  compactDishes,
  getOpenAI,
  missingKeyResponse,
  parseJsonFromModel,
} from "@/lib/openai";

export async function POST(request: Request) {
  const client = getOpenAI();
  if (!client) return missingKeyResponse();

  try {
    const { dishes } = await request.json();
    const compact = compactDishes(dishes);

    if (compact.length === 0) {
      return NextResponse.json({
        queries: [],
        explanation: "Add dishes first so TasteMap can learn your preferences.",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You generate restaurant search ideas from a user's saved food preferences. Return valid JSON only, with no code fences.",
        },
        {
          role: "user",
          content: `Here are the user's saved dishes:
${JSON.stringify(compact, null, 2)}

Generate 5 short restaurant search queries (like you'd type into Google Maps) and a one-sentence explanation.

Return exactly this JSON shape:
{
  "queries": ["query 1", "query 2", "query 3", "query 4", "query 5"],
  "explanation": "short explanation"
}`,
        },
      ],
    });

    const parsed = parseJsonFromModel(response.output_text);

    return NextResponse.json({
      queries: Array.isArray(parsed.queries)
        ? parsed.queries.filter((q: unknown) => typeof q === "string")
        : [],
      explanation:
        typeof parsed.explanation === "string" ? parsed.explanation : "",
    });
  } catch (error) {
    console.error("AI restaurant query error:", error);
    return NextResponse.json(
      { error: "Failed to generate restaurant ideas. Please try again." },
      { status: 500 }
    );
  }
}
