export type DishStatus = "tried" | "want_to_try";

export type Dish = {
    id: number;
    restaurant: string;
    dish: string;
    cuisine: string;
    // null for "want to try" items, which haven't been rated yet.
    rating: number | null;
    tags: string[];
    notes: string;
    city?: string | null;
    neighborhood?: string | null;
    price_level?: number | null;
    visited_on?: string | null;
    status?: DishStatus;
    photo_path?: string | null;
    user_id?: string;
    created_at?: string;
  };
  
  export type Recipe = {
    id: number;
    title: string;
    cuisine: string;
    timeMinutes: number;
    difficulty: string;
    tags: string[];
    ingredients: string[];
  };
// A recipe the user wrote or imported (table: user_recipes).
export type SavedRecipe = {
  id: number;
  user_id?: string;
  title: string;
  source_url: string | null;
  image_url: string | null;
  photo_path: string | null;
  cuisine: string | null;
  total_minutes: number | null;
  servings: string | null;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  notes: string | null;
  rating: number | null;
  created_at?: string;
};

// What the import endpoint returns: everything except the saved-row fields.
export type ImportedRecipe = Omit<
  SavedRecipe,
  "id" | "user_id" | "photo_path" | "notes" | "rating" | "created_at"
>;
