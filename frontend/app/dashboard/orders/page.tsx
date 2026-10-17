"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { Customer, Order, Shop } from "../../lib/types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PREPARING: "En préparation",
  READY: "Prête",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-teal-100 text-teal-800",
  PREPARING: "bg-teal-100 text-teal-800",
  READY: "bg-teal-100 text-teal-800",
  OUT_FOR_DELIVERY: "bg-teal-100 text-teal-800",
  DELIVERED: "bg-teal-700 text-white",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS);

function formatFcfa(value: string | number): string {
  return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function orderNumber(order: Order): string {
  return order.id.slice(0, 8).toUpperCase();
}

// Prepare un numero pour wa.me : chiffres seulement, avec l'indicatif.
// Un numero local senegalais a 9 chiffres (ex : 77 123 45 67) : on ajoute 221.
function toWhatsAppNumber(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9) digits = "221" + digits;
  return digits;
}

function buildReplyMessage(
  order: Order,
  customer: Customer,
  shopName: string
): string {
  const number = orderNumber(order);
  const total = formatFcfa(order.total);
  const hello = `Bonjour ${customer.name}, c'est ${shopName}.`;

  switch (order.status) {
    case "CONFIRMED":
    case "PENDING":
      return `${hello} Votre commande n° ${number} d'un montant de ${total} est bien confirmée. Merci de votre confiance !`;
    case "PREPARING":
      return `${hello} Votre commande n° ${number} est en cours de préparation.`;
    case "READY":
      return order.delivery_method === "delivery"
        ? `${hello} Votre commande n° ${number} est prête, nous organisons la livraison.`
        : `${hello} Votre commande n° ${number} est prête, vous pouvez venir la récupérer en boutique.`;
    case "OUT_FOR_DELIVERY":
      return `${hello} Votre commande n° ${number} est en cours de livraison.`;
    case "DELIVERED":
      return `${hello} Votre commande n° ${number} a été livrée. Merci et à bientôt !`;
    case "CANCELLED":
      return `${hello} Votre commande n° ${number} a été annulée. N'hésitez pas à nous contacter pour plus d'informations.`;
    default:
      return `${hello} Au sujet de votre commande n° ${number}.`;
  }
}

function buildReplyLink(
  order: Order,
  customer: Customer,
  shopName: string
): string {
  const message = buildReplyMessage(order, customer, shopName);
  return `https://wa.me/${toWhatsAppNumber(customer.phone)}?text=${encodeURIComponent(message)}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [shopName, setShopName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadOrders() {
    try {
      const data = await api.get<Order[]>("/api/v1/orders");
      setOrders(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();

    // Clients et nom de boutique : servent au bouton WhatsApp.
    // Si l'un des deux echoue, la page reste utilisable sans ce bouton.
    api
      .get<Customer[]>("/api/v1/customers")
      .then((list) => {
        const byId: Record<string, Customer> = {};
        list.forEach((c) => {
          byId[c.id] = c;
        });
        setCustomers(byId);
      })
      .catch(() => setCustomers({}));

    api
      .get<Shop>("/api/v1/shops/me")
      .then((shop) => setShopName(shop.name))
      .catch(() => setShopName(""));
  }, []);

  async function handleStatusChange(orderId: string, newStatus: string) {
    setError(null);
    setUpdatingId(orderId);
    try {
      await api.patch(`/api/v1/orders/${orderId}/status`, { status: newStatus });
      await loadOrders();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    } finally {
      setUpdatingId(null);
    }
  }

  if (isLoading) {
    return <p className="text-gray-600">Chargement...</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {orders.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow">
          Aucune commande pour le moment.
        </p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const customer = customers[order.customer_id];
            return (
              <li
                key={order.id}
                className="rounded-lg border-l-4 border-teal-500 bg-white p-4 shadow"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {formatFcfa(order.total)}
                    </p>
                    {customer ? (
                      <p className="truncate text-sm text-gray-700">
                        {customer.name}
                      </p>
                    ) : null}
                    <p className="text-xs text-gray-500">
                      N° {orderNumber(order)} - {formatDate(order.created_at)} -{" "}
                      {order.delivery_method === "delivery"
                        ? "Livraison"
                        : "Retrait"}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </button>

                {isExpanded ? (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {customer ? (
                      <div className="text-sm text-gray-700">
                        <p>
                          Client : <span className="font-medium">{customer.name}</span>
                        </p>
                        <p>Téléphone : {customer.phone}</p>
                      </div>
                    ) : null}

                    <ul className="space-y-1 text-sm text-gray-700">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex justify-between">
                          <span>
                            {item.product_name} x{item.quantity}
                          </span>
                          <span>{formatFcfa(item.subtotal)}</span>
                        </li>
                      ))}
                    </ul>

                    {order.delivery_method === "delivery" &&
                    order.delivery_address ? (
                      <p className="text-sm text-gray-600">
                        Adresse : {order.delivery_address}
                      </p>
                    ) : null}

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Statut de la commande
                      </label>
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-teal-600 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {customer ? (
                      <a
                        href={buildReplyLink(
                          order,
                          customer,
                          shopName || "votre boutique"
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-md bg-green-600 py-3 text-center text-sm font-medium text-white hover:bg-green-700"
                      >
                        Répondre sur WhatsApp
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}