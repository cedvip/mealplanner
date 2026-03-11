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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { url, imageBase64, mimeType } = body;

  try {
    let content: Anthropic.MessageParam["content"];

    if (url) {
      // Fetch the page HTML
      let pageText = "";
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; MealPlanner/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        const html = await res.text();
        // Strip HTML tags and trim
        pageText = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 8000);
      } catch {
        return NextResponse.json({ error: "Impossible de charger cette URL. Essayez avec une photo." }, { status: 422 });
      }
      content = `Voici le contenu d'une page de recette. Extrais la recette :\n\n${pageText}`;
    } else if (imageBase64 && mimeType) {
      content = [
        {
          type: "image",
          source: { type: "base64", media_type: mimeType, data: imageBase64 },
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
      model: "claude-haiku-4-5",
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
