"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, X, Leaf } from "lucide-react";
import { getWeekDays, formatDate, isSameDay } from "@/lib/utils";

interface Recipe {
  id: string;
  name: string;
  isVegetarian: boolean;
  defaultServings: number;
}

interface Meal {
  id: string;
  date: string;
  mealType: "LUNCH" | "DINNER";
  servings: number;
  recipe: Recipe;
}

interface CalendarClientProps {
  weekStart: string;
  meals: Meal[];
  recipes: Recipe[];
}


export default function CalendarClient({ weekStart, meals, recipes }: CalendarClientProps) {
  const router = useRouter();
  const startDate = new Date(weekStart);
  const days = getWeekDays(startDate);

  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<"LUNCH" | "DINNER">("LUNCH");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [servings, setServings] = useState(4);
  const [saving, setSaving] = useState(false);
  const [localMeals, setLocalMeals] = useState<Meal[]>(meals);

  function openModal(day: Date, mealType: "LUNCH" | "DINNER") {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setSelectedRecipeId(recipes[0]?.id ?? "");
    setServings(4);
    setShowModal(true);
  }

  async function addMeal() {
    if (!selectedDay || !selectedRecipeId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart,
          date: selectedDay.toISOString(),
          mealType: selectedMealType,
          recipeId: selectedRecipeId,
          servings,
        }),
      });
      if (res.ok) {
        const meal = await res.json();
        setLocalMeals((prev) => [...prev, meal]);
        setShowModal(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeal(mealId: string) {
    await fetch(`/api/meals/${mealId}`, { method: "DELETE" });
    setLocalMeals((prev) => prev.filter((m) => m.id !== mealId));
  }

  function navigateWeek(direction: number) {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + direction * 7);
    router.push(`/calendar?week=${newStart.toISOString().split("T")[0]}`);
  }

  function getMealsForSlot(day: Date, mealType: "LUNCH" | "DINNER") {
    return localMeals.filter(
      (m) => isSameDay(new Date(m.date), day) && m.mealType === mealType
    );
  }

  return (
    <div>
      {/* Header semaine */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Semaine du {startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </h1>
        <button
          onClick={() => navigateWeek(1)}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Grille calendrier */}
      <div className="space-y-3">
        {days.map((day, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-orange-50 px-4 py-2 border-b border-orange-100">
              <span className="font-semibold text-orange-700 text-sm">
                {day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {(["LUNCH", "DINNER"] as const).map((mealType) => {
                const slotMeals = getMealsForSlot(day, mealType);
                return (
                  <div key={mealType} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {mealType === "LUNCH" ? "☀️ Midi" : "🌙 Soir"}
                      </span>
                      <button
                        onClick={() => openModal(day, mealType)}
                        className="text-orange-400 hover:text-orange-600 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {slotMeals.map((meal) => (
                        <div
                          key={meal.id}
                          className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {meal.recipe.isVegetarian && <Leaf size={12} className="text-green-500 flex-shrink-0" />}
                            <span className="text-sm font-medium text-gray-700 truncate">{meal.recipe.name}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">· {meal.servings} pers.</span>
                          </div>
                          <button
                            onClick={() => deleteMeal(meal.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      {slotMeals.length === 0 && (
                        <p className="text-xs text-gray-300 italic">Rien de prévu</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal ajout repas */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Ajouter un repas</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">
                {selectedDay && formatDate(selectedDay)} ·{" "}
                {selectedMealType === "LUNCH" ? "Midi" : "Soir"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recette</label>
              {recipes.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune recette. Créez-en une d&apos;abord.</p>
              ) : (
                <select
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.isVegetarian ? "🥦 " : ""}{r.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de personnes</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.max(1, s - 1))}
                  className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center text-lg font-medium hover:bg-gray-50"
                >
                  −
                </button>
                <span className="text-lg font-bold w-8 text-center">{servings}</span>
                <button
                  type="button"
                  onClick={() => setServings((s) => s + 1)}
                  className="w-9 h-9 border border-gray-300 rounded-lg flex items-center justify-center text-lg font-medium hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={addMeal}
                disabled={saving || !selectedRecipeId}
                className="flex-1 bg-orange-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {saving ? "Ajout..." : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
