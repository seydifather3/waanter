"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import { useCart } from "../../../lib/cart";
import type { Order } from "../../../lib/types";

function formatFcfa(value: number | string): string {
  return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

interface CustomerInfo {
  name: string;
  phone: string;
}

function BackArrow() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function buildWhatsAppLink(
  shop: { phone: string; name: string },
  slug: string,
  order: Order,
  customer: CustomerInfo
): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const orderNumber = order.id.slice(0, 8).toUpperCase();

  const infoLines = [
    "Mes informations :",
    `Nom : ${customer.name}`,
    `Téléphone : ${customer.phone}`,
  ];
  if (order.delivery_method === "delivery") {
    infoLines.push("Réception : Livraison");
    infoLines.push(`Adresse : ${order.delivery_address ?? ""}`);
  } else {
    infoLines.push("Réception : Retrait en boutique");
  }

  const itemLines = order.items.flatMap((i) => [
    `- ${i.product_name} x${i.quantity} : ${formatFcfa(i.subtotal)}`,
    `  Voir le produit : ${baseUrl}/shop/${slug}?produit=${i.product_id}`,
  ]);

  const message = [
    `Bonjour, je viens de passer une commande (n° ${orderNumber}) sur ${shop.name}.`,
    "",
    ...infoLines,
    "",
    "Ma commande :",
    ...itemLines,
    "",
    `Total : ${formatFcfa(order.total)}`,
  ].join("\n");

  const digitsOnly = shop.phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export default function CartPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const cart = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">(
    "delivery"
  );
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const body = {
      customer_name: name,
      customer_phone: phone,
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === "delivery" ? address : null,
      items: cart.items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
      })),
    };

    try {
      const order = await api.post<Order>(
        `/api/v1/public/shops/${slug}/orders`,
        body
      );

      const shop = await api.get<{ phone: string; name: string }>(
        `/api/v1/public/shops/${slug}`
      );
      const link = buildWhatsAppLink(shop, slug, order, {
        name: name.trim(),
        phone: phone.trim(),
      });

      cart.clear();
      setWhatsappLink(link);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-teal-600 focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  if (whatsappLink) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="mx-auto max-w-3xl space-y-4 px-4 py-10 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Commande enregistrée !
          </h1>
          <p className="text-gray-600">
            Envoyez votre commande au vendeur sur WhatsApp pour la confirmer.
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700"
          >
            Envoyer sur WhatsApp
          </a>
          <div>
            <Link
              href={`/shop/${slug}`}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              <BackArrow />
              Retour à la boutique
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href={`/shop/${slug}`}
            aria-label="Retour à la boutique"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-teal-700 text-teal-700 hover:bg-teal-50"
          >
            <BackArrow />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900">Mon panier</h1>
            <Link
              href={`/shop/${slug}`}
              className="text-xs text-gray-500 hover:underline"
            >
              Retour à la boutique
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
        {cart.items.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center shadow">
            <p className="text-gray-600">Votre panier est vide.</p>
            <Link
              href={`/shop/${slug}`}
              className="mt-3 inline-block rounded-md bg-teal-700 px-4 py-2 text-sm text-white hover:bg-teal-800"
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
                      className="h-8 w-8 rounded-md border border-gray-300 text-gray-700 hover:border-teal-600"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => cart.increment(item.productId)}
                      className="h-8 w-8 rounded-md border border-gray-300 text-gray-700 hover:border-teal-600"
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

            {!showCheckout ? (
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full rounded-md bg-teal-700 py-3 font-medium text-white hover:bg-teal-800"
              >
                Passer la commande
              </button>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded-lg bg-white p-6 shadow"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  Vos informations
                </h2>

                <div>
                  <label className={labelClass}>Votre nom</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Votre téléphone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+221 77 000 00 00"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Mode de réception</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("delivery")}
                      className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium ${
                        deliveryMethod === "delivery"
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      Livraison
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod("pickup")}
                      className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium ${
                        deliveryMethod === "pickup"
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-gray-300 text-gray-700"
                      }`}
                    >
                      Retrait en boutique
                    </button>
                  </div>
                </div>

                {deliveryMethod === "delivery" ? (
                  <div>
                    <label className={labelClass}>Adresse de livraison</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                ) : null}

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md bg-teal-700 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {isSubmitting ? "Envoi..." : "Confirmer la commande"}
                </button>
              </form>
            )}
          </>
        )}
      </main>
    </div>
  );
}