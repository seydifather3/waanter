export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string;
  address: string | null;
  city: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  shop_id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string; // le backend renvoie un décimal sous forme de texte
  image_url: string | null;
  stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}