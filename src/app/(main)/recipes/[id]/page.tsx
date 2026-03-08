import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RecipeDetail from "./RecipeDetail";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: { include: { ingredient: true } } },
  });

  if (!recipe) notFound();

  return <RecipeDetail recipe={recipe} />;
}
