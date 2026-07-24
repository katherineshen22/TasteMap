import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { dishes } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

    if (!dishes || dishes.length === 0) {
      return NextResponse.json({
        summary: "Add a few dishes first so TasteMap can learn your preferences.",
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
            "You analyze a user's food preferences from saved restaurant dishes. Be specific, concise, and useful. Do not invent restaurants or dishes.",
        },
        {
          role: "user",
          content: `Here are my saved dishes as JSON:\n${JSON.stringify(
            compactDishes,
            null,
            2
          )}\n\nWrite a short taste profile summary and suggest 3 recipe directions I might like.`,
        },
      ],
    });

    return NextResponse.json({
      summary: response.output_text,
    });
  } catch (error) {
    console.error("AI taste summary error:", error);

    return NextResponse.json(
      { error: "Failed to generate taste summary." },
      { status: 500 }
    );
  }
}