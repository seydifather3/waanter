"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "../../lib/api";
import { isAuthenticated } from "../../lib/auth";
import { useCart } from "../../lib/cart";
import type { PublicCatalog, PublicShop } from "../../lib/types";

function formatFcfa(value: string | number): string {
  return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

export default function PublicShopPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const searchParams = useSearchParams();
  const highlightedProductId = searchParams.get("produit");
  const cart = useCart();

  const [shop, setShop] = useState<PublicShop | null>(null);
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [isMerchant, setIsMerchant] = useState(false);
  const [zoomed, setZoomed] = useState<{ url: string; name: string } | null>(
    null
  );

  // Un commercant connecte voit une fleche pour revenir a son tableau de bord.
  useEffect(() => {
    setIsMerchant(isAuthenticated());
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [shopData, catalogData] = await Promise.all([
          api.get<PublicShop>(`/api/v1/public/shops/${slug}`),
          api.get<PublicCatalog>(`/api/v1/public/shops/${slug}/products`),
        ]);
        setShop(shopData);
        setCatalog(catalogData);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError("Impossible de charger la boutique");
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (!highlightedProductId || !catalog) return;
    const el = document.getElementById(`produit-${highlightedProductId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightedProductId, catalog]);

  // Zoom : fermeture avec la touche Echap, et page figee derriere l'image.
  useEffect(() => {
    if (!zoomed) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(null);
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomed]);

  function handleAdd(id: string, name: string, price: string) {
    cart.addItem({ productId: id, name: name, price: Number(price) });
    setAddedId(id);
    setTimeout(() => setAddedId(null), 1200);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Chargement...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Boutique introuvable
        </h1>
        <p className="mt-2 text-gray-600">
          Ce lien n&apos;est pas valide. Verifiez l&apos;adresse de la boutique.
        </p>
      </main>
    );
  }

  if (error || !shop || !catalog) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <p className="text-red-600">{error ?? "Une erreur est survenue"}</p>
      </main>
    );
  }

  const visibleProducts = selectedCategory
    ? catalog.products.filter((p) => p.category_id === selectedCategory)
    : catalog.products;

  const chipBase =
    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {isMerchant ? (
        <div className="mx-auto max-w-3xl px-4 pt-3">
          <Link
            href="/dashboard"
            aria-label="Retour au tableau de bord"
            title="Retour au tableau de bord"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-white shadow hover:bg-teal-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
      ) : null}

      <header className="mt-3 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-6">
          {shop.logo_url ? (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-700">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
            {shop.description ? (
              <p className="mt-1 text-sm text-gray-600">{shop.description}</p>
            ) : null}
            <p className="mt-1 text-sm text-gray-500">
              {[shop.city, shop.phone].filter(Boolean).join(" - ")}
            </p>
          </div>
          <Link
            href={`/shop/${slug}/panier`}
            className="relative flex-shrink-0 rounded-full bg-teal-700 p-3 text-white"
            aria-label="Voir le panier"
          >
            Panier
            {cart.totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold">
                {cart.totalItems}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {catalog.categories.length > 0 ? (
          <nav className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`${chipBase} ${
                selectedCategory === null
                  ? "bg-teal-700 text-white"
                  : "bg-white text-gray-700 shadow-sm"
              }`}
            >
              Tout
            </button>
            {catalog.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`${chipBase} ${
                  selectedCategory === c.id
                    ? "bg-teal-700 text-white"
                    : "bg-white text-gray-700 shadow-sm"
                }`}
              >
                {c.name}
              </button>
            ))}
          </nav>
        ) : null}

        {visibleProducts.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow">
            Aucun produit disponible pour le moment.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {visibleProducts.map((p) => {
              const isHighlighted = p.id === highlightedProductId;
              const imageUrl = p.image_url;
              return (
                <li
                  key={p.id}
                  id={`produit-${p.id}`}
                  className={`overflow-hidden rounded-lg bg-white shadow ${
                    isHighlighted ? "ring-2 ring-teal-600" : ""
                  }`}
                >
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setZoomed({ url: imageUrl, name: p.name })}
                      aria-label={`Agrandir la photo de ${p.name}`}
                      className="block w-full cursor-zoom-in"
                    >
                      <img
                        src={imageUrl}
                        alt={p.name}
                        className="aspect-square w-full bg-gray-50 object-contain"
                      />
                    </button>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
                      Pas de photo
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    {p.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {p.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatFcfa(p.price)}
                    </p>
                    {!p.in_stock ? (
                      <p className="mt-1 text-sm font-medium text-red-600">
                        Rupture de stock
                      </p>
                    ) : (
                      <button
                        onClick={() => handleAdd(p.id, p.name, p.price)}
                        className="mt-3 w-full rounded-md bg-teal-700 py-2 text-sm font-medium text-white hover:bg-teal-800"
                      >
                        {addedId === p.id ? "Ajoute !" : "Ajouter au panier"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {zoomed ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomed.name}
          onClick={() => setZoomed(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            onClick={() => setZoomed(null)}
            aria-label="Fermer"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
          <img
            src={zoomed.url}
            alt={zoomed.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-md object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}