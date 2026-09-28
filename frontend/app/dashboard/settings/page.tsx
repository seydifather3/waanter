"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { Shop } from "../../lib/types";

export default function SettingsPage() {
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function fillForm(s: Shop) {
    setName(s.name);
    setPhone(s.phone);
    setDescription(s.description ?? "");
    setAddress(s.address ?? "");
    setCity(s.city ?? "");
  }

  useEffect(() => {
    async function load() {
      try {
        const myShop = await api.get<Shop>("/api/v1/shops/me");
        setShop(myShop);
        fillForm(myShop);
      } catch (err) {
        // 404 = pas encore de boutique : on affiche le formulaire de création
        if (!(err instanceof ApiError && err.status === 404)) {
          setError("Impossible de charger votre boutique");
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    const body = {
      name,
      phone,
      description: description || null,
      address: address || null,
      city: city || null,
    };

    try {
      if (shop) {
        const updated = await api.patch<Shop>("/api/v1/shops/me", body);
        setShop(updated);
        fillForm(updated);
        setSuccess("Boutique mise à jour");
      } else {
        const created = await api.post<Shop>("/api/v1/shops", body);
        setShop(created);
        fillForm(created);
        setSuccess("Boutique créée");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Impossible de contacter le serveur");
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-gray-600">Chargement...</p>;
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">
        {shop ? "Paramètres de la boutique" : "Créer ma boutique"}
      </h1>

      {shop && (
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Lien de votre boutique</p>
          <p className="font-mono text-sm text-gray-900">/shop/{shop.slug}</p>
          <p className="mt-1 text-xs text-gray-500">
            Ce lien ne change pas, même si vous modifiez le nom.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <div>
          <label className={labelClass}>Nom de la boutique</label>
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Téléphone de la boutique</label>
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
          <label className={labelClass}>Description (facultatif)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Adresse (facultatif)</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Ville (facultatif)</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-700">{success}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-md bg-gray-900 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {isSaving
            ? "Enregistrement..."
            : shop
              ? "Enregistrer les modifications"
              : "Créer ma boutique"}
        </button>
      </form>
    </div>
  );
}