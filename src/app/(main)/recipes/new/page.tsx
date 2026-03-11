"use client";

import { useEffect, useState } from "react";
import RecipeForm from "@/components/RecipeForm";

type ImportedRecipe = {
  name: string;
  description: string | null;
  defaultServings: number;
  isVegetarian: boolean;
  isPublic?: boolean;
  ingredients: { name: string; quantity: number; unit: string }[];
  steps: { title: string | null; description: string; imageUrl?: string | null }[];
};

function normalize(data: ImportedRecipe) {
  return {
    name: data.name ?? "",
    description: data.description ?? "",
    defaultServings: Number(data.defaultServings) || 4,
    isVegetarian: Boolean(data.isVegetarian),
    isPublic: Boolean(data.isPublic),
    imageUrl: null,
    ingredients: (data.ingredients ?? []).map((ing) => ({
      name: ing.name ?? "",
      quantity: Number(ing.quantity) || 0,
      unit: ing.unit ?? "g",
    })),
    steps: (data.steps ?? []).map((s) => ({
      title: s.title ?? "",
      description: s.description ?? "",
      imageUrl: s.imageUrl ?? null,
    })),
  };
}

export default function NewRecipePage() {
  const [importedData, setImportedData] = useState<ReturnType<typeof normalize> | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("recipe_import");
    if (raw) {
      try {
        setImportedData(normalize(JSON.parse(raw)));
      } catch {
        // ignore malformed data
      }
      sessionStorage.removeItem("recipe_import");
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Nouvelle recette</h1>
      <RecipeForm initialData={importedData} />
    </div>
  );
}
