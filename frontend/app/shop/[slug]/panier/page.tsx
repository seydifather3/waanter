"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "../../../lib/cart";

function formatFcfa(value: number): string {
  return `${value.toLocaleString("fr-FR")} FCFA`;
}

export default function CartPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const cart = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
          <Link
            href={`/shop/${slug}`}
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            Retour a la boutique
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Mon panier</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {cart.items.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center shadow">
            <p className="text-gray-600">Votre panier est vide.</p>
            <Link
              href={`/shop/${slug}`}
              className="mt-3 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
            >
              Voir les produits
            </Link>
          </div>
        ) : (
          <>
            <ul className="divide-y rounded-lg bg-white shadow">
              {cart.items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatFcfa(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => cart.decrement(item.productId)}
                      className="h-8 w-8 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      aria-label="Diminuer la quantite"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => cart.increment(item.productId)}
                      className="h-8 w-8 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                      aria-label="Augmenter la quantite"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => cart.removeItem(item.productId)}
                    className="ml-2 text-sm text-red-600 hover:underline"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>

            <div className="rounded-lg bg-white p-4 shadow">
              <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatFcfa(cart.totalPrice)}</span>
              </div>
            </div>

            <button
              disabled
              className="w-full rounded-md bg-gray-300 py-3 font-medium text-gray-600"
              title="Disponible a la prochaine etape"
            >
              Passer la commande (bientot disponible)
            </button>
          </>
        )}
      </main>
    </div>
  );
}