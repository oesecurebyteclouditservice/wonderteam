import { supabase } from './supabase';
import { MOCK_PROFILE, INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_ORDERS, INITIAL_TRANSACTIONS } from './mockData';
import { Product, Client, Order, OrderItem, Transaction, Profile } from '../types';

// Safely access env variables
const env = (import.meta as any).env || {};
let USE_MOCK = !env.VITE_SUPABASE_URL || env.VITE_USE_MOCK === 'true' || !supabase;

// Helper: get non-null Supabase client (only called when USE_MOCK is false)
function getSupabase() {
  if (!supabase) throw new Error('Supabase client not initialized');
  return supabase;
}

// In-memory store for mock updates during session
let mockProducts = [...INITIAL_PRODUCTS];
let mockClients = [...INITIAL_CLIENTS];
let mockOrders = [...INITIAL_ORDERS];
let mockTransactions = [...INITIAL_TRANSACTIONS];
let mockProfile = { ...MOCK_PROFILE };

// Auto-detect Supabase availability and fallback to mock mode
let _supabaseChecked = false;
async function ensureSupabaseOrMock(): Promise<void> {
  if (USE_MOCK || _supabaseChecked) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    // Probe an actual table instead of /rest/v1/ (which always returns 200 for swagger)
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/products?select=id&limit=0`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'apikey': env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
      }
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn(`Supabase table probe failed (status ${res.status}), switching to mock mode`);
      USE_MOCK = true;
    }
  } catch {
    console.warn('Supabase unreachable, switching to mock mode');
    USE_MOCK = true;
  } finally {
    _supabaseChecked = true;
  }
}

// Cached auth state: null = not checked, true/false = result
let _isAuthenticated: boolean | null = null;
async function isUserAuthenticated(): Promise<boolean> {
  if (USE_MOCK) return false;
  if (_isAuthenticated !== null) return _isAuthenticated;
  try {
    const { data: { user } } = await getSupabase().auth.getUser();
    _isAuthenticated = !!user;
  } catch {
    _isAuthenticated = false;
  }
  return _isAuthenticated;
}

// Listen for auth state changes to update cache
if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    _isAuthenticated = !!session?.user;
  });
}

// Per-query fallback: wraps a Supabase query so if it fails, returns mock data instead
async function withMockFallback<T>(queryFn: () => Promise<T>, mockFn: () => T, requiresAuth = false): Promise<T> {
  if (USE_MOCK) return mockFn();
  if (requiresAuth && !(await isUserAuthenticated())) {
    return mockFn();
  }
  try {
    return await queryFn();
  } catch (err) {
    console.warn('Supabase query failed, falling back to mock data:', err);
    return mockFn();
  }
}

// Check mock mode status (async - triggers Supabase check if needed)
export async function checkMockMode(): Promise<boolean> {
  await ensureSupabaseOrMock();
  return USE_MOCK;
}

export const DataService = {

  async signInWithGoogle() {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
      alert("Simulation: Connexion Google réussie !");
      return { data: { user: mockProfile }, error: null };
    }
    return await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  },

  async signUpWithEmail(email: string, password: string, fullName: string) {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
        // Create a new mock profile for the session
        mockProfile = {
            ...MOCK_PROFILE,
            email: email,
            full_name: fullName,
            id: `user_${Date.now()}`
        };
        await new Promise(resolve => setTimeout(resolve, 800));
        return { data: { user: mockProfile }, error: null };
    }

    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });

    // Automatically create profile entry if signup successful (handled by trigger usually, but good for safety)
    if (data.user && !error) {
        await sb.from('profiles').insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: 'vdi'
        });
    }

    return { data, error };
  },

  async signInWithEmail(email: string, password: string) {
      await ensureSupabaseOrMock();
      if (USE_MOCK) {
          // Allow any login in mock mode, just update email in profile
          mockProfile = { ...mockProfile, email };
          await new Promise(resolve => setTimeout(resolve, 800));
          return { data: { user: mockProfile }, error: null };
      }
      return await getSupabase().auth.signInWithPassword({ email, password });
  },

  async getProfile(): Promise<Profile | null> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return null;

        const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') throw error;

        return data || {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata.full_name || 'Utilisateur',
          role: 'vdi'
        };
      },
      () => mockProfile,
      true
    );
  },

  async updateProfile(updates: Partial<Profile>): Promise<void> {
      await ensureSupabaseOrMock();
      if (USE_MOCK) {
          mockProfile = { ...mockProfile, ...updates };
          return;
      }

      const sb = getSupabase();
      const user = (await sb.auth.getUser()).data.user;
      if (!user) throw new Error("Non authentifié");

      const { error } = await sb
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
  },

  async updateProfileAvatar(file: File): Promise<string> {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newUrl = URL.createObjectURL(file);
        mockProfile.avatar_url = newUrl;
        return newUrl;
    }

    const sb = getSupabase();
    const user = (await sb.auth.getUser()).data.user;
    if (!user) throw new Error("Non authentifié");

    // 1. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await sb.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = sb.storage
        .from('avatars')
        .getPublicUrl(fileName);

    // 3. Update Profile
    const { error: updateError } = await sb
        .from('profiles')
        .upsert({ id: user.id, avatar_url: publicUrl }); // Upsert to handle new profiles

    if (updateError) throw updateError;

    return publicUrl;
  },

  // ========================================
  // PRODUCTS
  // ========================================

  async getProducts(): Promise<Product[]> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().from('products').select('*').order('name');
        if (error) throw error;
        return data;
      },
      () => mockProducts
    );
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    await ensureSupabaseOrMock();
    const mockFn = () => {
      const newProduct = { ...product, id: `p_${Date.now()}_${Math.random()}` } as Product;
      mockProducts.push(newProduct);
      return newProduct;
    };
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().from('products').insert(product).select().single();
        if (error) throw error;
        return data;
      },
      mockFn
    );
  },

  async updateProductImage(productId: string, file: File): Promise<string> {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newUrl = URL.createObjectURL(file);
        const idx = mockProducts.findIndex(p => p.id === productId);
        if (idx !== -1) mockProducts[idx].image_url = newUrl;
        return newUrl;
    }

    const sb = getSupabase();
    // 1. Upload
    const fileExt = file.name.split('.').pop();
    const fileName = `product-${productId}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await sb.storage
        .from('products')
        .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 2. URL
    const { data: { publicUrl } } = sb.storage
        .from('products')
        .getPublicUrl(fileName);

    // 3. Update Table
    const { error: updateError } = await sb
        .from('products')
        .update({ image_url: publicUrl })
        .eq('id', productId);

    if (updateError) throw updateError;

    return publicUrl;
  },

  async updateStock(productId: string, newQuantity: number): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const { error } = await getSupabase().from('products').update({ stock_quantity: newQuantity }).eq('id', productId);
        if (error) throw error;
      },
      () => {
        const idx = mockProducts.findIndex(p => p.id === productId);
        if (idx !== -1) mockProducts[idx].stock_quantity = newQuantity;
      }
    );
  },

  async updateProduct(product: Product): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const { id, ...updates } = product;
        const { error } = await getSupabase().from('products').update(updates).eq('id', id);
        if (error) throw error;
      },
      () => {
        const idx = mockProducts.findIndex(p => p.id === product.id);
        if (idx !== -1) mockProducts[idx] = product;
      }
    );
  },

  async deleteProduct(productId: string): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const { error } = await getSupabase().from('products').delete().eq('id', productId);
        if (error) throw error;
      },
      () => {
        mockProducts = mockProducts.filter(p => p.id !== productId);
      },
      true
    );
  },

  // ========================================
  // CLIENTS
  // ========================================

  async getClients(): Promise<Client[]> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().from('clients').select('*').order('full_name');
        if (error) throw error;
        return data;
      },
      () => mockClients,
      true
    );
  },

  async addClient(client: Omit<Client, 'id' | 'user_id'>): Promise<Client> {
      await ensureSupabaseOrMock();
      const mockFn = () => {
        const newClient = { ...client, id: `c_${Date.now()}`, user_id: 'user_123' } as Client;
        mockClients.push(newClient);
        return newClient;
      };
      return withMockFallback(
        async () => {
          const sb = getSupabase();
          const { data: { user } } = await sb.auth.getUser();
          const { data, error } = await sb.from('clients').insert({...client, user_id: user?.id}).select().single();
          if (error) throw error;
          return data;
        },
        mockFn,
        true
      );
  },

  async updateClient(client: Client): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const { error } = await getSupabase().from('clients').update(client).eq('id', client.id);
        if (error) throw error;
      },
      () => {
        const idx = mockClients.findIndex(c => c.id === client.id);
        if (idx !== -1) mockClients[idx] = client;
      },
      true
    );
  },

  async deleteClient(clientId: string): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const { error } = await getSupabase().from('clients').delete().eq('id', clientId);
        if (error) throw error;
      },
      () => {
        mockClients = mockClients.filter(c => c.id !== clientId);
      },
      true
    );
  },

  // ========================================
  // ORDERS
  // ========================================

  async getOrders(): Promise<Order[]> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().from('orders').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      () => mockOrders,
      true
    );
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    await ensureSupabaseOrMock();
    const mockFn = () => {
      const newOrder = {
        ...order,
        id: `ord_${Date.now()}`,
        created_at: new Date().toISOString()
      } as Order;
      mockOrders.unshift(newOrder);
      return newOrder;
    };
    return withMockFallback(
      async () => {
        const { data: orderData, error: orderError } = await getSupabase()
          .from('orders')
          .insert({
            client_id: order.client_id,
            total_amount: order.total_amount,
            profit: order.profit,
            status: order.status,
            payment_status: order.payment_status,
            items: JSON.parse(JSON.stringify(order.items))
          })
          .select()
          .single();

        if (orderError) throw orderError;
        return orderData;
      },
      mockFn,
      true
    );
  },

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const { error } = await getSupabase().from('orders').update(updates).eq('id', orderId);
        if (error) throw error;
      },
      () => {
        const idx = mockOrders.findIndex(o => o.id === orderId);
        if (idx !== -1) mockOrders[idx] = { ...mockOrders[idx], ...updates } as Order;
      },
      true
    );
  },

  async deleteOrder(orderId: string): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const { error } = await getSupabase().from('orders').delete().eq('id', orderId);
        if (error) throw error;
      },
      () => {
        mockOrders = mockOrders.filter(o => o.id !== orderId);
      },
      true
    );
  },

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().from('order_items').select('*').eq('order_id', orderId).order('created_at');
        if (error) throw error;
        return data;
      },
      () => [],
      true
    );
  },

  async createOrderWithItems(
    clientId: string,
    items: any[],
    totalAmount: number,
    profit: number,
    status = 'pending',
    paymentStatus = 'pending',
    paymentMethod?: string
  ): Promise<string> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().rpc('create_order_with_items', {
          p_client_id: clientId,
          p_items: items,
          p_total_amount: totalAmount,
          p_profit: profit,
          p_status: status,
          p_payment_status: paymentStatus,
          p_payment_method: paymentMethod || null
        });
        if (error) throw error;
        return data;
      },
      () => {
        const orderId = `ord_${Date.now()}`;
        const newOrder: Order = {
          id: orderId,
          client_id: clientId,
          total_amount: totalAmount,
          profit: profit,
          status: status as any,
          payment_status: paymentStatus as any,
          items: items,
          created_at: new Date().toISOString()
        };
        mockOrders.unshift(newOrder);
        // Update mock stock
        items.forEach((item: any) => {
          const prod = mockProducts.find(p => p.id === item.product_id);
          if (prod) prod.stock_quantity = Math.max(0, prod.stock_quantity - item.quantity);
        });
        return orderId;
      },
      true
    );
  },

  // ========================================
  // TRANSACTIONS
  // ========================================

  async getTransactions(): Promise<Transaction[]> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().from('transactions').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
      },
      () => mockTransactions as Transaction[],
      true
    );
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction> {
    await ensureSupabaseOrMock();
    const mockFn = () => {
      const newTx = {
        ...transaction,
        id: `tx_${Date.now()}`,
        created_at: new Date().toISOString()
      } as Transaction;
      mockTransactions.unshift(newTx);
      return newTx;
    };
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().from('transactions').insert(transaction).select().single();
        if (error) throw error;
        return data;
      },
      mockFn,
      true
    );
  },

  // ========================================
  // RPC FUNCTIONS
  // ========================================

  async getDashboardStats(): Promise<any> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().rpc('get_dashboard_stats');
        if (error) throw error;
        return data;
      },
      () => {
        const revenue = mockOrders.reduce((acc, o) => acc + o.total_amount, 0);
        const profit = mockOrders.reduce((acc, o) => acc + o.profit, 0);
        const lowStockCount = mockProducts.filter(p => p.stock_quantity <= p.alert_threshold).length;
        const totalStockValue = mockProducts.reduce((acc, p) => acc + (p.stock_quantity * p.price_public), 0);
        return {
          total_revenue: revenue,
          total_profit: profit,
          total_clients: mockClients.length,
          total_products: mockProducts.length,
          low_stock_count: lowStockCount,
          total_orders: mockOrders.length,
          total_stock_value: totalStockValue
        };
      }
    );
  },

  async getLowStockProducts(threshold = 5): Promise<Product[]> {
    await ensureSupabaseOrMock();
    return withMockFallback(
      async () => {
        const { data, error } = await getSupabase().rpc('get_low_stock_products', { threshold });
        if (error) throw error;
        return data;
      },
      () => mockProducts.filter(p => p.stock_quantity <= threshold).sort((a, b) => a.stock_quantity - b.stock_quantity)
    );
  }
};
