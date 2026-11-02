"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api, ApiError } from "../lib/api";
import { saveToken } from "../lib/auth";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

// Regex de base pour la structure email
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov|mil|sn|fr|io|co|ai|me|info|biz|[a-zA-Z]{3,}$)/i;

// Liste des domaines interdits ou mal orthographiés fréquemment
const TYPO_DOMAINS: { [key: string]: string } = {
  "gmaile.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahou.com": "yahoo.com",
  "hotmaile.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Vérification de la structure générale de l'email
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError("Veuillez entrer une adresse e-mail valide (ex: nom@domaine.com)");
      return;
    }

    // 2. Extraction du domaine pour vérifier les fautes de frappe courantes
    const domain = cleanEmail.split("@")[1];
    if (TYPO_DOMAINS[domain]) {
      setError(`Domaine suspect détecté ("${domain}"). Vouliez-vous plutôt écrire "@${TYPO_DOMAINS[domain]}" ?`);
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/api/v1/auth/register", { name, email: cleanEmail, phone, password });

      const loginData = await api.post<LoginResponse>("/api/v1/auth/login", {
        identifier: cleanEmail,
        password,
      });
      saveToken(loginData.access_token);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Impossible de se connecter au serveur");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="Waantér"
            width={200}
            height={64}
            priority
            className="h-auto w-44"
          />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nom complet
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Telephone
            </label>
            <input
              type="tel"
              required
              placeholder="+221 77 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-teal-700 py-2 text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            {isLoading ? "Creation..." : "Creer mon compte"}
          </button>
        </form>
      </div>
    </main>
  );
}