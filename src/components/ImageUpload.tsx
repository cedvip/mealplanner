"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    onChange(data.url ?? null);
    setUploading(false);

    // reset input so re-selecting same file works
    if (inputRef.current) inputRef.current.value = "";
  }

  if (value) {
    return (
      <div className="relative w-full">
        {label && <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>}
        <div className="relative rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: "16/9" }}>
          <Image src={value} alt="Photo" fill className="object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-6 text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            <span className="text-sm">Envoi en cours...</span>
          </>
        ) : (
          <>
            <ImagePlus size={24} />
            <span className="text-sm">Ajouter une photo</span>
            <span className="text-xs text-gray-400">Depuis la galerie ou appareil photo</span>
          </>
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
  );
}
