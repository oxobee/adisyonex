import { notFound, redirect } from "next/navigation";
import { findRestaurantByUsername } from "@/repositories/restaurant.repository";

export const dynamic = "force-dynamic";

export default async function RestaurantSlugPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  if (!username) {
    notFound();
  }

  const restaurant = await findRestaurantByUsername(username);
  if (!restaurant || restaurant.deletedAt) {
    notFound();
  }

  redirect(`/order/${username}`);
}
