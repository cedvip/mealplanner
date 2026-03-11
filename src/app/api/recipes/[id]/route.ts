import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  if (!recipe) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(recipe);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (existing.userId !== session.user.id) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  const body = await req.json();
  const { name, description, defaultServings, isVegetarian, isPublic, imageUrl, ingredients, steps } = body;

  type StepInput = { title?: string; description: string; imageUrl?: string };

  // Supprimer les anciens ingrédients et étapes, puis recréer
  await prisma.recipeIngredient.deleteMany({ where: { recipeId: id } });
  await prisma.recipeStep.deleteMany({ where: { recipeId: id } });

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      name,
      description,
      defaultServings,
      isVegetarian,
      isPublic: isPublic ?? existing.isPublic,
      imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
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
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(recipe);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (existing.userId !== session.user.id) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
