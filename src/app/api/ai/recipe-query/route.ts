import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { dish } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You create concise recipe search queries. Return only the search query, no extra explanation.",
        },
        {
          role: "user",
          content: `Create a recipe search query for this dish:
Dish: ${dish.dish}
Cuisine: ${dish.cuisine}
Tags: ${dish.tags?.join(", ")}
Notes: ${dish.notes}`,
        },
      ],
    });

    return NextResponse.json({
      query: response.output_text.trim(),
    });
  } catch (error) {
    console.error("AI recipe query error:", error);

    return NextResponse.json(
      { error: "Failed to generate recipe query." },
      { status: 500 }
    );
  }
}