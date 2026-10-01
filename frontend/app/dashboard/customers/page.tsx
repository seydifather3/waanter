"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { Customer } from "../../lib/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<Customer[]>("/api/v1/customers");
        setCustomers(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Erreur serveur");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return <p className="text-gray-600">Chargement...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Clients</h1>

      {customers.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow">
          Aucun client pour le moment. Les clients apparaissent ici
          automatiquement des qu&apos;ils passent une commande.
        </p>
      ) : (
        <ul className="divide-y rounded-lg bg-white shadow">
          {customers.map((c) => (
            <li key={c.id} className="p-4">
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-sm text-gray-600">{c.phone}</p>
              {c.address ? (
                <p className="text-sm text-gray-500">{c.address}</p>
              ) : null}
              <p className="mt-1 text-xs text-gray-400">
                Client depuis le {formatDate(c.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}