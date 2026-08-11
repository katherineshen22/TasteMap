export type Dish = {
    id: number;
    restaurant: string;
    dish: string;
    cuisine: string;
    rating: number;
    tags: string[];
    notes: string;
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