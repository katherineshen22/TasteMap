import InternetRecipeSearch from "@/components/InternetRecipeSearch";
import { PageHeader } from "@/components/ui";

export default function InternetRecipesPage() {
  return (
    <>
      <PageHeader
        title="Find Recipes"
        description="Search thousands of recipes online by dish, cuisine, diet, and cooking time."
      />
      <InternetRecipeSearch />
    </>
  );
}
