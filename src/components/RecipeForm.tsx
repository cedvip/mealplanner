"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

interface Ingredient {
  name: string;
  quantity: number | "";
  unit: string;
}

interface RecipeFormProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    defaultServings: number;
    isVegetarian: boolean;
    ingredients: Ingredient[];
  };
}

const UNITS = ["g", "kg", "ml", "cl", "L", "pcs", "càs", "càc", "pincée"];

export default function RecipeForm({ initialData }: RecipeFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [defaultServings, setDefaultServings] = useState(initialData?.defaultServings ?? 4);
  const [isVegetarian, setIsVegetarian] = useState(initialData?.isVegetarian ?? false);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients ?? [{ name: "", quantity: "", unit: "g" }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addIngredient() {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "g" }]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string | number) {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validIngredients = ingredients.filter(
      (ing) => ing.name.trim() && ing.quantity !== "" && Number(ing.quantity) > 0
    );

    setLoading(true);
    try {
      const url = isEditing ? `/api/recipes/${initialData.id}` : "/api/recipes";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          defaultServings,
          isVegetarian,
          ingredients: validIngredients.map((ing) => ({
            name: ing.name.trim(),
            quantity: Number(ing.quantity),
            unit: ing.unit,
          })),
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      router.push("/recipes");
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      {/* Infos de base */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
        <h2 className="font-semibold text-gray-700">Informations générales</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la recette *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Ex: Poulet rôti aux herbes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            placeholder="Notes sur la préparation..."
          />
        </div>

        <div className="flex items-center gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personnes (défaut)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={defaultServings}
              onChange={(e) => setDefaultServings(Number(e.target.value))}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={isVegetarian}
              onChange={(e) => setIsVegetarian(e.target.checked)}
              className="w-4 h-4 accent-green-500"
            />
            <span className="text-sm font-medium text-gray-700">🥦 Recette végétarienne</span>
          </label>
        </div>
      </div>

      {/* Ingrédients */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-3">
        <h2 className="font-semibold text-gray-700">Ingrédients</h2>

        {ingredients.map((ing, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={ing.name}
              onChange={(e) => updateIngredient(i, "name", e.target.value)}
              placeholder="Ingrédient"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <input
              type="number"
              min={0}
              step="any"
              value={ing.quantity}
              onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
              placeholder="Qté"
              className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <select
              value={ing.unit}
              onChange={(e) => updateIngredient(i, "unit", e.target.value)}
              className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeIngredient(i)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addIngredient}
          className="flex items-center gap-2 text-orange-500 hover:text-orange-600 text-sm font-medium"
        >
          <Plus size={16} />
          Ajouter un ingrédient
        </button>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-orange-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "Sauvegarde..." : isEditing ? "Mettre à jour" : "Créer la recette"}
        </button>
      </div>
    </form>
  );
}
