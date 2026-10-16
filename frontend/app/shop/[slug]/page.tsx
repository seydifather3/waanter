import type { Metadata } from "next";
import { Suspense } from "react";
import ShopView from "./shop-view";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface MetaShop {
  name: string;
  description: string | null;
  logo_url: string | null;
}

interface MetaProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
}

interface MetaCatalog {
  products: MetaProduct[];
}

function formatPrice(value: string): string {
  return Number(value)
    .toLocaleString("fr-FR")
    .replace(/[\u202f\u00a0]/g, " ");
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ produit?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { produit } = await searchParams;

  // Pas de produit dans le lien : on garde l'apercu de la boutique (layout)
  if (!produit) return {};

  try {
    const [shopRes, catalogRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/public/shops/${slug}`, { cache: "no-store" }),
      fetch(`${API_URL}/api/v1/public/shops/${slug}/products`, {
        cache: "no-store",
      }),
    ]);
    if (!shopRes.ok || !catalogRes.ok) return {};

    const shop: MetaShop = await shopRes.json();
    const catalog: MetaCatalog = await catalogRes.json();
    const product = catalog.products.find((p) => p.id === produit);
    if (!product) return {};

    const title = `${product.name} - ${formatPrice(product.price)} FCFA`;
    const base = `Disponible chez ${shop.name}.`;
    const description = product.description
      ? `${base} ${product.description}`.slice(0, 200)
      : base;
    const image = product.image_url ?? shop.logo_url;

    return {
      title: `${title} - ${shop.name}`,
      description,
      openGraph: {
        type: "website",
        title,
        description,
        siteName: shop.name,
        images: image ? [image] : [],
      },
    };
  } catch {
    return {};
  }
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopView />
    </Suspense>
  );
}