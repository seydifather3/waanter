import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <Image
        src="/logo.png"
        alt="Waantér"
        width={280}
        height={90}
        priority
        className="h-auto w-56 sm:w-64"
      />
      <p className="mt-4 max-w-md text-gray-600">
        Creez gratuitement votre boutique en ligne et recevez vos commandes,
        meme si vous n&apos;y connaissez rien en informatique.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className="rounded-md bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800"
        >
          Creer ma boutique gratuitement
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-teal-700 px-6 py-3 font-medium text-teal-700 hover:bg-teal-50"
        >
          J&apos;ai deja un compte
        </Link>
      </div>

      <ul className="mt-12 grid max-w-2xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
        <li className="rounded-lg bg-white p-4 shadow border-t-4 border-teal-500">
          <p className="font-semibold text-gray-900">Gratuit</p>
          <p className="mt-1 text-sm text-gray-600">
            Aucun frais pour creer votre boutique.
          </p>
        </li>
        <li className="rounded-lg bg-white p-4 shadow border-t-4 border-teal-500">
          <p className="font-semibold text-gray-900">Simple</p>
          <p className="mt-1 text-sm text-gray-600">
            Ajoutez vos produits en quelques clics.
          </p>
        </li>
        <li className="rounded-lg bg-white p-4 shadow border-t-4 border-teal-500">
          <p className="font-semibold text-gray-900">WhatsApp</p>
          <p className="mt-1 text-sm text-gray-600">
            Recevez vos commandes directement sur WhatsApp.
          </p>
        </li>
      </ul>
    </main>
  );
}