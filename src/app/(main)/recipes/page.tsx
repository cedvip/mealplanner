import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Plus, Leaf } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const recipes = await prisma.recipe.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { ingredients: true } } },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mes recettes</h1>
        <Link
          href="/recipes/new"
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus size={16} />
          Nouvelle recette
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Aucune recette pour l&apos;instant.</p>
          <p className="text-sm mt-1">Commencez par en créer une !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{recipe.name}</span>
                  {recipe.isVegetarian && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <Leaf size={10} />
                      Végé
                    </span>
                  )}
                </div>
                {recipe.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{recipe.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {recipe._count.ingredients} ingrédient{recipe._count.ingredients > 1 ? "s" : ""} · {recipe.defaultServings} personnes
                </p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
