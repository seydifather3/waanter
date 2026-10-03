"use client";

import { useParams } from "next/navigation";
import { CartProvider } from "../../lib/cart";

export default function CartWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  return <CartProvider shopSlug={params.slug}>{children}</CartProvider>;
}