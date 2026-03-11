import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `Tu es un assistant qui extrait des informations de recettes de cuisine.
Retourne UNIQUEMENT un JSON valide, sans texte autour, avec cette structure exacte :
{
  "name": "Nom de la recette",
  "description": "Courte description (1-2 phrases max, ou null)",
  "defaultServings": 4,
  "isVegetarian": false,
  "ingredients": [
    { "name": "Nom ingrédient", "quantity": 200, "unit": "g" }
  ],
  "steps": [
    { "title": null, "description": "Description de l'étape" }
  ]
}
Règles :
- Les unités doivent être parmi : g, kg, ml, cl, L, pcs, càs, càc, pincée
- Si une unité ne correspond pas, convertis ou utilise la plus proche
- defaultServings doit être un nombre entier entre 1 et 20
- isVegetarian : true seulement si la recette ne contient pas de viande ni poisson
- Les titres d'étapes peuvent être null si non précisés
- quantity doit être un nombre (pas une chaîne)`;

function extractJsonLd(html: string): string | null {
  const matches = html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of matches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Recipe" || (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))) {
          return JSON.stringify(item);
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { url, imageBase64, mimeType } = body;

  try {
    let content: Anthropic.MessageParam["content"];

    if (url) {
      let pageText = "";
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
          signal: AbortSignal.timeout(10000),
        });
        const html = await res.text();

        // Essaie d'abord d'extraire les données structurées JSON-LD (Marmiton, 750g, etc.)
        const jsonLd = extractJsonLd(html);
        if (jsonLd) {
          pageText = `Données structurées schema.org/Recipe de la page :\n${jsonLd.slice(0, 10000)}`;
        } else {
          // Fallback : texte brut sans balises HTML
          pageText = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 8000);
        }
      } catch {
        return NextResponse.json({ error: "Impossible de charger cette URL. Essayez avec une photo." }, { status: 422 });
      }
      content = `Voici le contenu d'une page de recette. Extrais la recette :\n\n${pageText}`;
    } else if (imageBase64 && mimeType) {
      content = [
        {
          type: "image",
          source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 },
        },
        {
          type: "text",
          text: "Extrais la recette présente dans cette image.",
        },
      ];
    } else {
      return NextResponse.json({ error: "URL ou image requise" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Réponse invalide");

    const recipe = JSON.parse(jsonMatch[0]);
    return NextResponse.json(recipe);
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Erreur lors de l'analyse. Réessayez." }, { status: 500 });
  }
}
