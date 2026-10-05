"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { clearToken, isAuthenticated } from "../lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/dashboard/products", label: "Produits" },
  { href: "/dashboard/categories", label: "Categories" },
  { href: "/dashboard/orders", label: "Commandes" },
  { href: "/dashboard/customers", label: "Clients" },
  { href: "/dashboard/settings", label: "Parametres" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (!checked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Image
            src="/logo.png"
            alt="Waantér"
            width={140}
            height={45}
            priority
            className="h-auto w-32"
          />
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:border-teal-600 hover:text-teal-700"
          >
            Deconnexion
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-teal-700 text-white"
                    : "text-gray-600 hover:bg-teal-50 hover:text-teal-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  );
}