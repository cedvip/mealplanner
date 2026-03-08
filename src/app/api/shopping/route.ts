import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");

  if (!weekStart) return NextResponse.json({ error: "weekStart requis" }, { status: 400 });

  const startDate = new Date(weekStart);

  const weekPlan = await prisma.weekPlan.findUnique({
    where: { userId_startDate: { userId: session.user.id, startDate } },
    include: {
      meals: {
        include: {
          recipe: {
            include: {
              ingredients: {
                include: { ingredient: true },
              },
            },
          },
        },
      },
    },
  });

  if (!weekPlan) return NextResponse.json([]);

  // Agréger les ingrédients avec ajustement de portions
  const totals: Record<string, { name: string; quantity: number; unit: string }> = {};

  for (const meal of weekPlan.meals) {
    const ratio = meal.servings / meal.recipe.defaultServings;
    for (const ri of meal.recipe.ingredients) {
      const key = `${ri.ingredient.name}__${ri.unit}`;
      if (!totals[key]) {
        totals[key] = { name: ri.ingredient.name, quantity: 0, unit: ri.unit };
      }
      totals[key].quantity += ri.quantity * ratio;
    }
  }

  const list = Object.values(totals).map((item) => ({
    ...item,
    quantity: Math.round(item.quantity * 100) / 100,
  }));

  return NextResponse.json(list.sort((a, b) => a.name.localeCompare(b.name)));
}
