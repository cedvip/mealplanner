"use client";

import { useEffect, useState } from "react";
import RecipeForm from "@/components/RecipeForm";

export default function NewRecipePage() {
  const [importedData, setImportedData] = useState<Parameters<typeof RecipeForm>[0]["initialData"] | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("recipe_import");
    if (raw) {
      try {
        setImportedData(JSON.parse(raw));
      } catch {
        // ignore
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
