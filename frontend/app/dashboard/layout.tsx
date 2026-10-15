"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";
import { clearToken, isAuthenticated } from "../lib/auth";
import type { Shop } from "../lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/dashboard/products", label: "Produits" },
  { href: "/dashboard/categories", label: "Categories" },
  { href: "/dashboard/orders", label: "Commandes" },
  { href: "/dashboard/customers", label: "Clients" },
  { href: "/dashboard/settings", label: "Parametres" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shopSlug, setShopSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  // Recupere le lien de la boutique pour le bouton "Voir ma boutique".
  // Si le commercant n'a pas encore de boutique, le bouton n'apparait pas.
  useEffect(() => {
    if (!checked) return;
    api
      .get<Shop>("/api/v1/shops/me")
      .then((shop) => setShopSlug(shop.slug))
      .catch(() => setShopSlug(null));
  }, [checked, pathname]);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  function isActive(href: string): boolean {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  if (!checked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Image
            src="/logo.png"
            alt="Waantér"
            width={140}
            height={45}
            priority
            className="h-auto w-32"
          />

          <div className="flex items-center gap-2">
            {/* Ordinateur : boutons visibles */}
            {shopSlug ? (
              <a
                href={`/shop/${shopSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-md bg-teal-700 px-3 py-1 text-sm font-medium text-white hover:bg-teal-800 md:block"
              >
                Voir ma boutique
              </a>
            ) : null}
            <button
              onClick={handleLogout}
              className="hidden rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:border-teal-600 hover:text-teal-700 md:block"
            >
              Deconnexion
            </button>

            {/* Telephone : bouton a trois traits */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:border-teal-600 hover:text-teal-700 md:hidden"
            >
              {menuOpen ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Ordinateur : menu horizontal */}
        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 pb-2 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                isActive(item.href)
                  ? "bg-teal-700 text-white"
                  : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Telephone : menu deroulant vertical */}
        {menuOpen ? (
          <nav className="border-t bg-white px-4 py-2 md:hidden">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-md px-3 py-3 text-base font-medium ${
                      isActive(item.href)
                        ? "bg-teal-700 text-white"
                        : "text-gray-700 hover:bg-teal-50 hover:text-teal-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {shopSlug ? (
                <li className="border-t pt-2">
                  <a
                    href={`/shop/${shopSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-md border border-teal-700 px-3 py-3 text-center text-base font-medium text-teal-700 hover:bg-teal-50"
                  >
                    Voir ma boutique
                  </a>
                </li>
              ) : null}
              <li className="border-t pt-2">
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-md px-3 py-3 text-left text-base font-medium text-red-700 hover:bg-red-50"
                >
                  Deconnexion
                </button>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}