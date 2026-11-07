import { NextResponse } from "next/server";
import { ImportError, importRecipe } from "@/lib/recipeImport";
import { supabase } from "@/lib/supabaseClient";

// POST { url } -> { recipe }. Requires a logged-in user (Bearer access token)
// so the server can't be used as an anonymous web proxy.
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const { data } = token
    ? await supabase.auth.getUser(token)
    : { data: { user: null } };
  if (!data.user) {
    return NextResponse.json(
      { error: "Please log in to import recipes." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url || url.length > 2000) {
    return NextResponse.json({ error: "Paste a recipe link." }, { status: 400 });
  }

  try {
    const recipe = await importRecipe(url);
    return NextResponse.json({ recipe });
  } catch (error) {
    if (error instanceof ImportError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Recipe import error:", error);
    return NextResponse.json(
      { error: "Something went wrong importing that recipe." },
      { status: 500 }
    );
  }
}
