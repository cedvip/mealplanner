import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MealType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStart = searchParams.get("weekStart");

  if (!weekStart) return NextResponse.json({ error: "weekStart requis" }, { status: 400 });

  const startDate = new Date(weekStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  const weekPlan = await prisma.weekPlan.findUnique({
    where: { userId_startDate: { userId: session.user.id, startDate } },
    include: {
      meals: {
        include: { recipe: { include: { ingredients: { include: { ingredient: true } } } } },
        orderBy: [{ date: "asc" }, { mealType: "asc" }],
      },
    },
  });

  return NextResponse.json(weekPlan ?? { meals: [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { weekStart, date, mealType, recipeId, servings } = body;

  if (!weekStart || !date || !mealType || !recipeId) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const startDate = new Date(weekStart);

  // Créer ou récupérer le WeekPlan
  const weekPlan = await prisma.weekPlan.upsert({
    where: { userId_startDate: { userId: session.user.id, startDate } },
    update: {},
    create: { userId: session.user.id, startDate },
  });

  const meal = await prisma.meal.create({
    data: {
      weekPlanId: weekPlan.id,
      date: new Date(date),
      mealType: mealType as MealType,
      recipeId,
      servings: servings ?? 4,
    },
    include: { recipe: { include: { ingredients: { include: { ingredient: true } } } } },
  });

  return NextResponse.json(meal, { status: 201 });
}
