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

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await api.post<LoginResponse>("/api/v1/auth/login", {
        identifier,
        password,
      });
      saveToken(data.access_token);
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
              Email ou telephone
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}