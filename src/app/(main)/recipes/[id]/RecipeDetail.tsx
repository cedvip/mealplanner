"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { Leaf, Globe, Lock, Pencil, Trash2 } from "lucide-react";

interface RecipeDetailProps {
  recipe: {
    id: string;
    name: string;
    description: string | null;
    defaultServings: number;
    isVegetarian: boolean;
    isPublic: boolean;
    userId: string | null;
    ingredients: {
      quantity: number;
      unit: string;
      ingredient: { name: string };
    }[];
  };
  currentUserId: string;
}

export default function RecipeDetail({ recipe, currentUserId }: RecipeDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isOwner = recipe.userId === currentUserId;

  async function handleDelete() {
    if (!confirm("Supprimer cette recette ?")) return;
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    router.push("/recipes");
    router.refresh();
  }

  if (editing) {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Modifier la recette</h1>
        <RecipeForm
          initialData={{
            id: recipe.id,
            name: recipe.name,
            description: recipe.description ?? "",
            defaultServings: recipe.defaultServings,
            isVegetarian: recipe.isVegetarian,
            isPublic: recipe.isPublic,
            ingredients: recipe.ingredients.map((ri) => ({
              name: ri.ingredient.name,
              quantity: ri.quantity,
              unit: ri.unit,
            })),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800">{recipe.name}</h1>
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
            ) : (
              <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                <Lock size={10} />
                Privé
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">Pour {recipe.defaultServings} personnes</p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-sm text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pencil size={14} />
              Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 text-sm text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        )}
      </div>

      {recipe.description && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <p className="text-gray-700 text-sm whitespace-pre-line">{recipe.description}</p>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-3">Ingrédients</h2>
        {recipe.ingredients.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun ingrédient renseigné.</p>
        ) : (
          <ul className="space-y-2">
            {recipe.ingredients.map((ri, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{ri.ingredient.name}</span>
                <span className="text-gray-500 font-medium">
                  {ri.quantity} {ri.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={() => router.back()}
        className="mt-6 text-sm text-gray-500 hover:text-gray-700"
      >
        ← Retour aux recettes
      </button>
    </div>
  );
}
