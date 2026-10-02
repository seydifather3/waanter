"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../lib/api";
import { clearToken } from "../lib/auth";
import type { Shop, ShopStats, User } from "../lib/types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmee",
  PREPARING: "En preparation",
  READY: "Prete",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livree",
  CANCELLED: "Annulee",
};

function formatFcfa(value: string | number): string {
  return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const me = await api.get<User>("/api/v1/auth/me");
        setUser(me);

        try {
          const myShop = await api.get<Shop>("/api/v1/shops/me");
          setShop(myShop);

          const myStats = await api.get<ShopStats>("/api/v1/stats");
          setStats(myStats);
        } catch (err) {
          if (!(err instanceof ApiError && err.status === 404)) {
            throw err;
          }
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
          router.replace("/login");
          return;
        }
        setError("Impossible de charger vos informations");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [router]);

  if (isLoading) {
    return <p className="text-gray-600">Chargement...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">
        Bonjour {user ? user.name : ""}
      </h1>

      {shop ? (
        <>
          <div className="flex items-center gap-4 rounded-lg bg-white p-6 shadow">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xl font-semibold text-gray-500">
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {shop.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Lien de votre boutique : /shop/{shop.slug}
              </p>
              {shop.city ? (
                <p className="mt-1 text-sm text-gray-600">
                  Ville : {shop.city}
                </p>
              ) : null}
              <Link
                href="/dashboard/settings"
                className="mt-2 inline-block text-sm font-medium text-blue-700 hover:underline"
              >
                Modifier ma boutique
              </Link>
            </div>
          </div>

          {stats ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white p-4 text-center shadow">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_orders}
                  </p>
                  <p className="text-xs text-gray-600">Commandes</p>
                </div>
                <div className="rounded-lg bg-white p-4 text-center shadow">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatFcfa(stats.total_sales)}
                  </p>
                  <p className="text-xs text-gray-600">Ventes</p>
                </div>
                <div className="rounded-lg bg-white p-4 text-center shadow">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_products}
                  </p>
                  <p className="text-xs text-gray-600">Produits</p>
                </div>
              </div>

              <div className="rounded-lg bg-white p-4 shadow">
                <h3 className="mb-2 font-semibold text-gray-900">
                  Commandes recentes
                </h3>
                {stats.recent_orders.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Aucune commande pour le moment.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {stats.recent_orders.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between py-2"
                      >
                        <span className="text-sm text-gray-900">
                          {formatFcfa(o.total)}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          {STATUS_LABELS[o.status] ?? o.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/dashboard/orders"
                  className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline"
                >
                  Voir toutes les commandes
                </Link>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Vous n&apos;avez pas encore de boutique
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Creez votre boutique en une minute pour commencer a vendre.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-3 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Creer ma boutique
          </Link>
        </div>
      )}
    </div>
  );
}