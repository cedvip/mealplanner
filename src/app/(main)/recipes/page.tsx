import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Plus, Leaf, Globe, Lock } from "lucide-react";
import RecipeImportButton from "@/components/RecipeImportButton";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const session = await auth();
  const userId = session!.user.id;

  const recipes = await prisma.recipe.findMany({
    where: { OR: [{ isPublic: true }, { userId }] },
    orderBy: { name: "asc" },
    include: { _count: { select: { ingredients: true } } },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recettes</h1>
        <div className="flex items-center gap-2">
          <RecipeImportButton />
          <Link
            href="/recipes/new"
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            Nouvelle
          </Link>
        </div>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-800">{recipe.name}</span>
                  {recipe.isVegetarian && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      <Leaf size={10} />
                      Végé
                    </span>
                  )}
                  {recipe.isPublic ? (
                    <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      <Globe size={10} />
                      Public
                    </span>
                  ) : recipe.userId === userId ? (
                    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      <Lock size={10} />
                      Privé
                    </span>
                  ) : null}
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
