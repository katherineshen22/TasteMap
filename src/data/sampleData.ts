import { Dish, Recipe } from "@/types/food";

export const dishes: Dish[] = [
    {
      id: 1,
      restaurant: "Terakawa Ramen",
      dish: "Spicy Miso Ramen",
      cuisine: "Japanese",
      rating: 9.1,
      tags: ["spicy", "savory", "umami", "noodle-based"],
      notes: "Really rich broth and good spice level.",
    },
    {
      id: 2,
      restaurant: "Dim Sum Garden",
      dish: "Soup Dumplings",
      cuisine: "Chinese",
      rating: 9.4,
      tags: ["savory", "comforting", "juicy"],
      notes: "Would definitely order again.",
    },
    {
      id: 3,
      restaurant: "Honeygrow",
      dish: "Spicy Garlic Stir Fry",
      cuisine: "Asian Fusion",
      rating: 8.2,
      tags: ["spicy", "garlicky", "noodle-based"],
      notes: "Good quick meal.",
    },
  ];
  
  export const recipes: Recipe[] = [
    {
      id: 1,
      title: "Spicy Miso Ramen",
      cuisine: "Japanese",
      timeMinutes: 30,
      difficulty: "Medium",
      tags: ["spicy", "savory", "umami", "noodle-based"],
      ingredients: ["ramen noodles", "miso paste", "chili oil", "mushrooms", "scallions"],
    },
    {
      id: 2,
      title: "Chili Garlic Noodles",
      cuisine: "Chinese",
      timeMinutes: 20,
      difficulty: "Easy",
      tags: ["spicy", "garlicky", "savory", "noodle-based"],
      ingredients: ["noodles", "garlic", "soy sauce", "chili oil"],
    },
    {
      id: 3,
      title: "Vegetarian Dumpling Bowl",
      cuisine: "Chinese",
      timeMinutes: 35,
      difficulty: "Medium",
      tags: ["savory", "comforting", "umami"],
      ingredients: ["dumplings", "bok choy", "soy sauce", "sesame oil"],
    },
  ];