"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En production, on pourrait envoyer cette erreur a un service de suivi.
    // Pour l'instant, on l'affiche simplement dans la console du navigateur.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">
        Une erreur est survenue
      </h1>
      <p className="mt-2 text-gray-600">
        Quelque chose s&apos;est mal passe. Vous pouvez reessayer.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
      >
        Reessayer
      </button>
    </main>
  );
}