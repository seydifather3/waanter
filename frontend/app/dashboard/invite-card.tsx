"use client";

import { useState } from "react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://waanter.vercel.app";

const INVITE_LINK = `${SITE_URL}/register`;

const INVITE_MESSAGE = `Salut ! Je te recommande Waantér : tu crées ta boutique en ligne gratuitement et tu reçois tes commandes sur WhatsApp. Inscris-toi ici : ${INVITE_LINK}`;

export default function InviteCard() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(INVITE_LINK);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copie impossible : le lien reste affiché, on peut le copier à la main
    }
  }

  return (
    <div className="rounded-lg border-l-4 border-teal-500 bg-white p-4 shadow">
      <h3 className="font-semibold text-gray-900">
        Inviter un ami commerçant
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Partagez Waantér avec un ami qui veut vendre en ligne.
      </p>
      <p className="mt-2 break-all font-mono text-xs text-gray-500">
        {INVITE_LINK}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(INVITE_MESSAGE)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Envoyer sur WhatsApp
        </a>
        <button
          onClick={handleCopy}
          className="rounded-md border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
        >
          {copied ? "Lien copié !" : "Copier le lien"}
        </button>
      </div>
    </div>
  );
}