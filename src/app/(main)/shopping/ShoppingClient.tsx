"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ShoppingCart, RotateCcw } from "lucide-react";

interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
}

interface ShoppingClientProps {
  weekStart: string;
  shoppingList: ShoppingItem[];
}

export default function ShoppingClient({ weekStart, shoppingList }: ShoppingClientProps) {
  const router = useRouter();
  const startDate = new Date(weekStart);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  function toggleItem(name: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function navigateWeek(direction: number) {
    const newStart = new Date(startDate);
    newStart.setDate(newStart.getDate() + direction * 7);
    setCheckedItems(new Set());
    router.push(`/shopping?week=${newStart.toISOString().split("T")[0]}`);
  }

  const uncheckedItems = shoppingList.filter((i) => !checkedItems.has(i.name));
  const checkedList = shoppingList.filter((i) => checkedItems.has(i.name));

  return (
    <div className="max-w-md mx-auto">
      {/* Header semaine */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Liste de courses
        </h1>
        <button
          onClick={() => navigateWeek(1)}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <p className="text-center text-sm text-gray-500 mb-6">
        Semaine du {startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
      </p>

      {shoppingList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aucun repas planifié cette semaine.</p>
          <p className="text-sm mt-1">Ajoutez des repas dans le calendrier.</p>
        </div>
      ) : (
        <>
          {checkedItems.size > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setCheckedItems(new Set())}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                <RotateCcw size={12} />
                Tout décocher
              </button>
            </div>
          )}

          {/* Items à acheter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            {uncheckedItems.length === 0 ? (
              <div className="p-6 text-center text-green-600">
                <p className="font-semibold">✅ Tout est coché !</p>
                <p className="text-sm text-gray-400 mt-1">Vos courses sont prêtes.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {uncheckedItems.map((item) => (
                  <li
                    key={item.name}
                    onClick={() => toggleItem(item.name)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Items déjà cochés */}
          {checkedList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden opacity-60">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-400">Déjà à la maison</span>
              </div>
              <ul className="divide-y divide-gray-50">
                {checkedList.map((item) => (
                  <li
                    key={item.name}
                    onClick={() => toggleItem(item.name)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded border-2 border-green-400 bg-green-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-sm text-gray-400 line-through">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-400 line-through">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4">
            {uncheckedItems.length} article{uncheckedItems.length > 1 ? "s" : ""} restant{uncheckedItems.length > 1 ? "s" : ""}
          </p>
        </>
      )}
    </div>
  );
}
