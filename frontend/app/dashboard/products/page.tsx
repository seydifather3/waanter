"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../lib/api";
import { uploadImage } from "../../lib/upload";
import type { Category, Product } from "../../lib/types";

function formatFcfa(value: string | number): string {
  return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null);
  const [needsShop, setNeedsShop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAll() {
    try {
      const [prods, cats] = await Promise.all([
        api.get<Product[]>("/api/v1/products"),
        api.get<Category[]>("/api/v1/categories"),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNeedsShop(true);
      } else {
        setError("Impossible de charger les produits");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setStock("0");
    setCategoryId("");
    setDescription("");
    setShowForm(false);
  }

  function startCreate() {
    resetForm();
    setError(null);
    setShowForm(true);
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(Math.round(Number(p.price))));
    setStock(String(p.stock));
    setCategoryId(p.category_id ?? "");
    setDescription(p.description ?? "");
    setError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const body = {
      name: name.trim(),
      price: Number(price),
      stock: Number(stock),
      category_id: categoryId || null,
      description: description.trim() || null,
    };

    try {
      if (editingId) {
        await api.patch<Product>(`/api/v1/products/${editingId}`, body);
      } else {
        await api.post<Product>("/api/v1/products", body);
      }
      resetForm();
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(p: Product) {
    setError(null);
    try {
      await api.patch<Product>(`/api/v1/products/${p.id}`, {
        active: !p.active,
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    }
  }

  async function handleDelete(p: Product) {
    const ok = window.confirm(`Supprimer le produit "${p.name}" ?`);
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/api/v1/products/${p.id}`);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    }
  }

  async function handleImageChange(
    productId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingImageFor(productId);

    try {
      await uploadImage<Product>(`/api/v1/products/${productId}/image`, file);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    } finally {
      setUploadingImageFor(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function categoryName(id: string | null): string {
    if (!id) return "Sans catégorie";
    return categories.find((c) => c.id === id)?.name ?? "Sans catégorie";
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
          Il faut une boutique avant d&apos;ajouter des produits.
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

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
        {!showForm && (
          <button
            onClick={startCreate}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Ajouter un produit
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg bg-white p-6 shadow"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            {editingId ? "Modifier le produit" : "Nouveau produit"}
          </h2>

          <div>
            <label className={labelClass}>Nom du produit</label>
            <input
              type="text"
              required
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prix (FCFA)</label>
              <input
                type="number"
                required
                min={1}
                step={1}
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input
                type="number"
                required
                min={0}
                step={1}
                inputMode="numeric"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Catégorie (facultatif)</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
              <option value="">Sans catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Description (facultatif)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          {!editingId && (
            <p className="text-xs text-gray-500">
              Vous pourrez ajouter une photo juste après avoir créé le produit.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-md bg-gray-900 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {isSaving
                ? "Enregistrement..."
                : editingId
                  ? "Enregistrer"
                  : "Ajouter le produit"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {!showForm && error && <p className="text-sm text-red-600">{error}</p>}

      {products.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-sm text-gray-600 shadow">
          Aucun produit pour le moment. Cliquez sur « Ajouter un produit ».
        </p>
      ) : (
        <ul className="divide-y rounded-lg bg-white shadow">
          {products.map((p) => (
            <li key={p.id} className="space-y-2 p-4">
              <div className="flex items-start gap-3">
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-400">
                    Pas de photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFcfa(p.price)} · Stock : {p.stock}
                      </p>
                      <p className="text-xs text-gray-500">
                        {categoryName(p.category_id)}
                      </p>
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                        p.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {p.active ? "Actif" : "Masqué"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => startEdit(p)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Modifier
                </button>
                <button
                  onClick={() => toggleActive(p)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {p.active ? "Masquer" : "Activer"}
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Supprimer
                </button>
                <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  {uploadingImageFor === p.id ? "Envoi..." : "Changer la photo"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingImageFor === p.id}
                    onChange={(e) => handleImageChange(p.id, e)}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}