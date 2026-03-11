"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import RecipeImportModal from "./RecipeImportModal";

export default function RecipeImportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-orange-300 text-orange-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors"
      >
        <Sparkles size={16} />
        Importer
      </button>
      {open && <RecipeImportModal onClose={() => setOpen(false)} />}
    </>
  );
}
