"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(shopSlug: string): string {
  return `waanter_cart_${shopSlug}`;
}

export function CartProvider({
  shopSlug,
  children,
}: {
  shopSlug: string;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charge le panier sauvegarde au premier affichage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey(shopSlug));
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // localStorage indisponible ou donnees corrompues : on part d'un panier vide
    } finally {
      setIsLoaded(true);
    }
  }, [shopSlug]);

  // Sauvegarde a chaque changement, une fois le chargement initial termine
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey(shopSlug), JSON.stringify(items));
    } catch {
      // stockage plein ou indisponible : le panier reste fonctionnel en memoire
    }
  }, [items, isLoaded, shopSlug]);

  function addItem(newItem: Omit<CartItem, "quantity">) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newItem.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }

  function increment(productId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }

  function decrement(productId: string) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clear() {
    setItems([]);
  }

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        increment,
        decrement,
        removeItem,
        clear,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart doit etre utilise a l'interieur de CartProvider");
  }
  return ctx;
}