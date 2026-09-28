"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../lib/api";
import type { Category } from "../../lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [needsShop, setNeedsShop] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCategories() {
    try {
      const data = await api.get<Category[]>("/api/v1/categories");
      setCategories(data);
    } catch (err) {
      // 404 = le commerçant n'a pas encore de boutique
      if (err instanceof ApiError && err.status === 404) {
        setNeedsShop(true);
      } else {
        setError("Impossible de charger les catégories");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const name = newName.trim();
    if (!name) return;

    try {
      await api.post<Category>("/api/v1/categories", { name });
      setNewName("");
      await loadCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditingName(category.name);
    setError(null);
  }

  async function handleSaveEdit(id: string) {
    setError(null);
    const name = editingName.trim();
    if (!name) return;

    try {
      await api.patch<Category>(`/api/v1/categories/${id}`, { name });
      setEditingId(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    }
  }

  async function handleDelete(category: Category) {
    const ok = window.confirm(
      `Supprimer la catégorie "${category.name}" ? Les produits de cette catégorie ne seront pas supprimés.`
    );
    if (!ok) return;

    setError(null);
    try {
      await api.delete(`/api/v1/categories/${category.id}`);
      await loadCategories();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    }
  }

  if (isLoading) {
    return <p className="text-gray-600">Chargement...</p>;
  }

  if (needsShop) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6">
        <h1 className="text-lg font-semibold text-gray-900">
          Créez d&apos;abord votre boutique
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Il faut une boutique avant d&apos;ajouter des catégories.
        </p>
        <Link
          href="/dashboard/settings"
          className="mt-3 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          Créer ma boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>

      <form
        onSubmit={handleAdd}
        className="flex gap-2 rounded-lg bg-white p-4 shadow"
      >
        <input
          type="text"
          required
          maxLength={100}
          placeholder="Nouvelle catégorie (ex : Vêtements)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
        >
          Ajouter
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {categories.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow">
          Aucune catégorie pour le moment. Ajoutez la première ci-dessus.
        </p>
      ) : (
        <ul className="divide-y rounded-lg bg-white shadow">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-wrap items-center gap-2 p-4"
            >
              {editingId === category.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    maxLength={100}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSaveEdit(category.id)}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 text-gray-900">
                    {category.name}
                  </span>
                  <button
                    onClick={() => startEdit(category)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Renommer
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}