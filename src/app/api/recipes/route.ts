import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = session.user.id;

  const recipes = await prisma.recipe.findMany({
    where: { OR: [{ isPublic: true }, { userId }] },
    include: { ingredients: { include: { ingredient: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { name, description, defaultServings, isVegetarian, isPublic, imageUrl, ingredients, steps } = body;

  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  type StepInput = { title?: string; description: string; imageUrl?: string };

  const recipe = await prisma.recipe.create({
    data: {
      name,
      description,
      defaultServings: defaultServings ?? 4,
      isVegetarian: isVegetarian ?? false,
      isPublic: isPublic ?? false,
      imageUrl: imageUrl ?? null,
      userId: session.user.id,
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
      steps: {
        create: (steps ?? []).map((step: StepInput, i: number) => ({
          order: i + 1,
          title: step.title || null,
          description: step.description,
          imageUrl: step.imageUrl ?? null,
        })),
      },
    },
    include: { ingredients: { include: { ingredient: true } }, steps: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(recipe, { status: 201 });
}
