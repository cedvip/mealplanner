import RecipeForm from "@/components/RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle recette</h1>
      <RecipeForm />
    </div>
  );
}
