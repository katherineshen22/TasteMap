import { NextResponse } from "next/server";
import { compactDishes, getOpenAI, missingKeyResponse } from "@/lib/openai";

export async function POST(request: Request) {
  const client = getOpenAI();
  if (!client) return missingKeyResponse();

  try {
    const { dishes } = await request.json();
    const compact = compactDishes(dishes);

    if (compact.length === 0) {
      return NextResponse.json({
        summary: "Add a few dishes first so TasteMap can learn your preferences.",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You analyze a user's food preferences from saved restaurant dishes. Be specific, warm, and concise. Do not invent restaurants or dishes. Write plain text (no markdown symbols like # or **).",
        },
        {
          role: "user",
          content: `Here are my saved dishes as JSON:\n${JSON.stringify(
            compact,
            null,
            2
          )}\n\nWrite a short taste profile summary (2-3 sentences), then suggest 3 recipe directions I might like as a short list.`,
        },
      ],
    });

    return NextResponse.json({ summary: response.output_text.trim() });
  } catch (error) {
    console.error("AI taste summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate taste summary. Please try again." },
      { status: 500 }
    );
  }
}
