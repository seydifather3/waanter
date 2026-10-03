import type { Metadata } from "next";
import CartWrapper from "./cart-wrapper";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PublicShopForMeta {
  name: string;
  description: string | null;
  logo_url: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await fetch(`${API_URL}/api/v1/public/shops/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return { title: "Boutique introuvable - Waanter" };
    }
    const shop: PublicShopForMeta = await res.json();

    return {
      title: `${shop.name} - Waanter`,
      description: shop.description ?? `Decouvrez les produits de ${shop.name} sur Waanter.`,
      openGraph: {
        title: shop.name,
        description: shop.description ?? `Decouvrez les produits de ${shop.name} sur Waanter.`,
        images: shop.logo_url ? [shop.logo_url] : [],
      },
    };
  } catch {
  
    return { title: "Waanter" };
  }
}

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CartWrapper>{children}</CartWrapper>;
}