import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const recipes = await prisma.recipe.findMany({
    include: { ingredients: { include: { ingredient: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { name, description, defaultServings, isVegetarian, ingredients } = body;

  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const recipe = await prisma.recipe.create({
    data: {
      name,
      description,
      defaultServings: defaultServings ?? 4,
      isVegetarian: isVegetarian ?? false,
      ingredients: {
        create: await Promise.all(
          (ingredients ?? []).map(
            async (ing: { name: string; quantity: number; unit: string }) => {
              const ingredient = await prisma.ingredient.upsert({
                where: { name: ing.name },
                update: {},
                create: { name: ing.name, defaultUnit: ing.unit },
              });
              return {
                ingredientId: ingredient.id,
                quantity: ing.quantity,
                unit: ing.unit,
              };
            }
          )
        ),
      },
    },
    include: { ingredients: { include: { ingredient: true } } },
  });

  return NextResponse.json(recipe, { status: 201 });
}
