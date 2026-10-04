import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-gray-600">
        Cette page n&apos;existe pas ou plus.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
      >
        Retour a l&apos;accueil
      </Link>
    </main>
  );
}