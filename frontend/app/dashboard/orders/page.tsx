"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { Order } from "../../lib/types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmee",
  PREPARING: "En preparation",
  READY: "Prete",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livree",
  CANCELLED: "Annulee",
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
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
            return (
              <li key={order.id} className="rounded-lg bg-white p-4 shadow">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatFcfa(order.total)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.created_at)} -{" "}
                      {order.delivery_method === "delivery"
                        ? "Livraison"
                        : "Retrait"}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </button>

                {isExpanded ? (
                  <div className="mt-3 space-y-3 border-t pt-3">
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>
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