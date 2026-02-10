export interface Recruit {
  id: string;
  name: string;
  join_date: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'vdi';
  team_name?: string;
  sponsor?: string;
  recruits?: Recruit[];
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  reference?: string;
  price_public: number;
  price_cost: number;
  stock_quantity: number;
  alert_threshold: number;
  sku?: string;
  barcode?: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postal_code?: string;
  status: 'new' | 'active' | 'vip' | 'inactive' | 'relance';
  birth_date?: string;
  notes?: string;
  loyalty_points?: number;
  preferred_contact?: string;
  last_purchase_date?: string;
  total_spent?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  client_id: string;
  total_amount: number;
  profit: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  payment_status: 'pending' | 'paid';
  items: any;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description?: string;
  category?: string;
  payment_method?: string;
  reference_id?: string;
  order_id?: string;
  transaction_date?: string;
  created_by?: string;
  created_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export type ViewState = 'dashboard' | 'catalog' | 'pos' | 'clients' | 'profile' | 'login' | 'stock' | 'orders' | 'finance';
