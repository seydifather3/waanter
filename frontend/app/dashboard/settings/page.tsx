"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { uploadImage } from "../../lib/upload";
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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      name: name,
      phone: phone,
      description: description || null,
      address: address || null,
      city: city || null,
    };

    try {
      if (shop) {
        const updated = await api.patch<Shop>("/api/v1/shops/me", body);
        setShop(updated);
        fillForm(updated);
        setSuccess("Boutique mise a jour");
      } else {
        const created = await api.post<Shop>("/api/v1/shops", body);
        setShop(created);
        fillForm(created);
        setSuccess("Boutique creee");
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

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files ? e.target.files[0] : null;
    if (!file) return;
    setError(null);
    setIsUploadingLogo(true);

    try {
      const updated = await uploadImage<Shop>("/api/v1/shops/me/logo", file);
      setShop(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur serveur");
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        {shop ? "Parametres de la boutique" : "Creer ma boutique"}
      </h1>

      {shop ? (
        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm text-gray-600">Lien de votre boutique</p>
          <p className="font-mono text-sm text-gray-900">/shop/{shop.slug}</p>
          <p className="mt-1 text-xs text-gray-500">
            Ce lien ne change pas, meme si vous modifiez le nom.
          </p>
        </div>
      ) : null}

      {shop ? (
        <div className="rounded-lg bg-white p-6 shadow">
          <p className={labelClass}>Logo de la boutique</p>
          <div className="flex items-center gap-4">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt="Logo de la boutique"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-semibold text-gray-500">
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <label className="inline-block cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                {isUploadingLogo ? "Envoi en cours..." : "Changer le logo"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoChange}
                  disabled={isUploadingLogo}
                  className="hidden"
                />
              </label>
              <p className="mt-1 text-xs text-gray-500">
                JPEG, PNG ou WebP, 5 Mo maximum
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow">
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
          <label className={labelClass}>Telephone de la boutique</label>
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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {success ? <p className="text-sm text-green-700">{success}</p> : null}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-md bg-gray-900 py-2 text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {isSaving ? "Enregistrement..." : shop ? "Enregistrer les modifications" : "Creer ma boutique"}
        </button>
      </form>
    </div>
  );
}