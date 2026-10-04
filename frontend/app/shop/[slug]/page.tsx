"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "../../lib/api";
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        setNotFound(false);

        const [shopData, catalogData] = await Promise.all([
          api.get<PublicShop>(`/api/v1/public/shops/${slug}`),
          api.get<PublicCatalog>(
            `/api/v1/public/shops/${slug}/products`
          ),
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

    if (slug) {
      load();
    }
  }, [slug]);

  useEffect(() => {
    if (!highlightedProductId || !catalog) {
      return;
    }

    const element = document.getElementById(
      `produit-${highlightedProductId}`
    );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedProductId, catalog]);

  function handleAdd(
    id: string,
    name: string,
    price: string | number
  ) {
    cart.addItem({
      productId: id,
      name,
      price: Number(price),
    });

    setAddedId(id);

    setTimeout(() => {
      setAddedId(null);
    }, 1200);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

          <p className="text-sm text-slate-500">
            Chargement de la boutique...
          </p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
            🏪
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">
            Boutique introuvable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ce lien n&apos;est pas valide. Vérifiez l&apos;adresse de la
            boutique.
          </p>
        </div>
      </main>
    );
  }

  if (error || !shop || !catalog) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            !
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            Une erreur est survenue
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error ?? "Impossible de charger la boutique."}
          </p>
        </div>
      </main>
    );
  }

  const visibleProducts = selectedCategory
    ? catalog.products.filter(
        (product) => product.category_id === selectedCategory
      )
    : catalog.products;

  const chipBase =
    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex min-h-[76px] items-center gap-3 sm:gap-4">
            {/* Logo */}

            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="h-12 w-12 flex-shrink-0 rounded-xl object-cover ring-1 ring-slate-200 sm:h-14 sm:w-14"
              />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white sm:h-14 sm:w-14">
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Informations boutique */}

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {shop.name}
              </h1>

              {shop.description ? (
                <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">
                  {shop.description}
                </p>
              ) : null}

              {shop.city || shop.phone ? (
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {[shop.city, shop.phone]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              ) : null}
            </div>

            {/* Panier */}

            <Link
              href={`/shop/${slug}/panier`}
              aria-label="Voir le panier"
              className="relative flex h-10 flex-shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95 sm:h-11 sm:px-4"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4h2l1.5 11h10L18 8H6"
                />

                <circle cx="9" cy="19" r="1" />
                <circle cx="16" cy="19" r="1" />
              </svg>

              <span className="hidden sm:inline">
                Panier
              </span>

              {cart.totalItems > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-white">
                  {cart.totalItems}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}

      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        {/* Catégories */}

        {catalog.categories.length > 0 ? (
          <nav className="-mx-4 mb-6 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
            <div className="flex w-max gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className={`${chipBase} ${
                  selectedCategory === null
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                Tout
              </button>

              {catalog.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategory(category.id)
                  }
                  className={`${chipBase} ${
                    selectedCategory === category.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </nav>
        ) : null}

        {/* Titre */}

        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Produits
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {visibleProducts.length}{" "}
            {visibleProducts.length > 1
              ? "produits disponibles"
              : "produit disponible"}
          </p>
        </div>

        {/* Produits */}

        {visibleProducts.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              📦
            </div>

            <p className="mt-4 text-sm font-medium text-slate-700">
              Aucun produit disponible pour le moment.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {visibleProducts.map((product) => {
              const isHighlighted =
                product.id === highlightedProductId;

              const isAdded = addedId === product.id;

              return (
                <li
                  key={product.id}
                  id={`produit-${product.id}`}
                  className={`group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-3xl ${
                    isHighlighted
                      ? "ring-2 ring-slate-900 ring-offset-2"
                      : ""
                  }`}
                >
                  {/* Image */}

                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Pas de photo
                      </div>
                    )}

                    {!product.in_stock ? (
                      <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-red-600 shadow-sm">
                        Rupture
                      </span>
                    ) : null}
                  </div>

                  {/* Informations produit */}

                  <div className="p-3.5 sm:p-4">
                    <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-slate-900 sm:text-base">
                      {product.name}
                    </h3>

                    {product.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 sm:text-sm">
                        {product.description}
                      </p>
                    ) : (
                      <div className="h-5" />
                    )}

                    <p className="mt-3 text-base font-bold text-slate-900 sm:text-lg">
                      {formatFcfa(product.price)}
                    </p>

                    {!product.in_stock ? (
                      <div className="mt-3 flex h-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-medium text-slate-400 sm:h-11 sm:text-sm">
                        Rupture de stock
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleAdd(
                            product.id,
                            product.name,
                            product.price
                          )
                        }
                        className={`mt-3 h-10 w-full rounded-xl text-xs font-semibold transition active:scale-[0.98] sm:h-11 sm:text-sm ${
                          isAdded
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-900 text-white hover:bg-slate-800"
                        }`}
                      >
                        {isAdded
                          ? "✓ Ajouté"
                          : "Ajouter au panier"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      {/* Panier mobile */}

      {cart.totalItems > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-slate-500">
                Votre panier
              </p>

              <p className="text-sm font-bold text-slate-900">
                {cart.totalItems}{" "}
                {cart.totalItems > 1
                  ? "articles"
                  : "article"}
              </p>
            </div>

            <Link
              href={`/shop/${slug}/panier`}
              className="flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95"
            >
              Voir le panier
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}