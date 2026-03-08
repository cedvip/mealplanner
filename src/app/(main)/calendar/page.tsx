import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCurrentWeekStart } from "@/lib/utils";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
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
        include: { recipe: true },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
      },
    },
  });

  const recipes = await prisma.recipe.findMany({ orderBy: { name: "asc" } });

  // Sérialiser les dates pour le Client Component
  const serializedMeals = (weekPlan?.meals ?? []).map((meal) => ({
    ...meal,
    date: meal.date.toISOString(),
  }));

  return (
    <CalendarClient
      weekStart={weekStart.toISOString()}
      meals={serializedMeals}
      recipes={recipes}
    />
  );
}
