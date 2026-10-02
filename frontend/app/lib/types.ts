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
  price: string;
  image_url: string | null;
  stock: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicShop {
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  phone: string;
  address: string | null;
  city: string | null;
}

export interface PublicCategory {
  id: string;
  name: string;
}

export interface PublicProduct {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string;
  image_url: string | null;
  in_stock: boolean;
}

export interface PublicCatalog {
  categories: PublicCategory[];
  products: PublicProduct[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Order {
  id: string;
  shop_id: string;
  customer_id: string;
  total: string;
  status: string;
  payment_status: string;
  delivery_status: string;
  delivery_method: "delivery" | "pickup";
  delivery_address: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShopStats {
  total_orders: number;
  total_sales: string;
  total_products: number;
  recent_orders: Order[];
}