import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCurrentWeekStart } from "@/lib/utils";
import ShoppingClient from "./ShoppingClient";

export const dynamic = "force-dynamic";

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  const { week } = await searchParams;

  const weekStart = week ? new Date(week) : getCurrentWeekStart();
  weekStart.setHours(0, 0, 0, 0);

  const weekPlan = await prisma.weekPlan.findUnique({
    where: {
      userId_startDate: { userId: session!.user.id, startDate: weekStart },
    },
    include: {
      meals: {
        include: {
          recipe: {
            include: { ingredients: { include: { ingredient: true } } },
          },
        },
      },
    },
  });

  // Agréger les ingrédients
  const totals: Record<string, { name: string; quantity: number; unit: string }> = {};

  for (const meal of weekPlan?.meals ?? []) {
    const ratio = meal.servings / meal.recipe.defaultServings;
    for (const ri of meal.recipe.ingredients) {
      const key = `${ri.ingredient.name}__${ri.unit}`;
      if (!totals[key]) {
        totals[key] = { name: ri.ingredient.name, quantity: 0, unit: ri.unit };
      }
      totals[key].quantity += ri.quantity * ratio;
    }
  }

  const shoppingList = Object.values(totals)
    .map((item) => ({ ...item, quantity: Math.round(item.quantity * 100) / 100 }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <ShoppingClient
      weekStart={weekStart.toISOString()}
      shoppingList={shoppingList}
    />
  );
}
