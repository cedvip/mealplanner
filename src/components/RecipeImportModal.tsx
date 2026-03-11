"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Link2, ImagePlus, Loader2 } from "lucide-react";

interface RecipeImportModalProps {
  onClose: () => void;
}

export default function RecipeImportModal({ onClose }: RecipeImportModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"url" | "photo">("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport(imageBase64?: string, mimeType?: string) {
    setError(null);
    setLoading(true);
    try {
      const body = imageBase64 ? { imageBase64, mimeType } : { url };
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
        return;
      }
      sessionStorage.setItem("recipe_import", JSON.stringify(data));
      router.push("/recipes/new");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(",");
      const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
      handleImport(base64, mimeType);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-orange-500" />
            <h2 className="font-bold text-gray-800">Importer avec l&apos;IA</h2>
          </div>
          <button onClick={onClose}>
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab("url")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "url" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            <Link2 size={14} />
            Lien URL
          </button>
          <button
            onClick={() => setTab("photo")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === "photo" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
            }`}
          >
            <ImagePlus size={14} />
            Photo
          </button>
        </div>

        {tab === "url" ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Colle le lien d&apos;une recette (Marmiton, 750g, blog culinaire…)
            </p>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.marmiton.org/recettes/..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={() => handleImport()}
              disabled={loading || !url.trim()}
              className="w-full bg-orange-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Analyse en cours...</> : <><Sparkles size={16} /> Analyser la recette</>}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Prends en photo une recette (livre, magazine, écran…)
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-8 text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={24} className="animate-spin" /><span className="text-sm">Analyse en cours...</span></>
              ) : (
                <><ImagePlus size={24} /><span className="text-sm font-medium">Choisir une photo</span><span className="text-xs">Galerie ou appareil photo</span></>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <p className="text-xs text-gray-400 text-center">
          La recette sera pré-remplie — tu pourras la modifier avant de sauvegarder.
        </p>
      </div>
    </div>
  );
}
