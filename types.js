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
  sponsor_id?: string; // Keep for backward compatibility if needed, or deprecate
  sponsor?: string; // Display name of the sponsor
  recruits?: Recruit[]; // List of recruits
}

export interface Product {
  id: string;
  reference: string;
  name: string;
  brand: string;
  category: string;
  price_public: number;
  price_cost: number;
  stock_quantity: number;
  image_url?: string;
  alert_threshold: number;
}

export interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: 'new' | 'active' | 'vip' | 'inactive' | 'relance';
  last_purchase_date?: string;
  notes?: string;
  user_id: string;
}

export interface Order {
  id: string;
  client_id: string;
  total_amount: number;
  profit: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  payment_link_id?: string;
  payment_status: 'pending' | 'paid';
  created_at: string;
  items: CartItem[]; // Virtual field for frontend
}

export interface CartItem extends Product {
  quantity: number;
}

export type ViewState = 'dashboard' | 'catalog' | 'pos' | 'clients' | 'profile' | 'login' | 'stock' | 'orders' | 'finance';
