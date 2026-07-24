import OpenAI from "openai";
import { NextResponse } from "next/server";


type Dish = {
  restaurant: string;
  dish: string;
  cuisine: string;
  rating: number;
  tags: string[];
  notes: string;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OpenAI API key. Check your .env.local file." },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey,
    });

    const { dishes } = await request.json();

    if (!dishes || dishes.length === 0) {
      return NextResponse.json({
        queries: [],
        explanation: "Add dishes first so TasteMap can learn your preferences.",
      });
    }

    const compactDishes = dishes.slice(0, 20).map((dish: Dish) => ({
      restaurant: dish.restaurant,
      dish: dish.dish,
      cuisine: dish.cuisine,
      rating: dish.rating,
      tags: dish.tags,
      notes: dish.notes,
    }));

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You generate restaurant search ideas from a user's saved food preferences. Return valid JSON only.",
        },
        {
          role: "user",
          content: `Here are the user's saved dishes:
${JSON.stringify(compactDishes, null, 2)}

Generate 5 restaurant search queries and a short explanation.

Return exactly this JSON shape:
{
  "queries": ["query 1", "query 2", "query 3", "query 4", "query 5"],
  "explanation": "short explanation"
}`,
        },
      ],
    });

    const text = response.output_text.trim();
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI restaurant query error:", error);
  
    const message =
      error instanceof Error ? error.message : "Unknown AI error";
  
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}