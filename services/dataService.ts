import { supabase } from './supabase';
import { MOCK_PROFILE, INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_ORDERS } from './mockData';
import { Product, Client, Order, Profile } from '../types';

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
let mockProfile = { ...MOCK_PROFILE };

// Auto-detect Supabase availability and fallback to mock mode
let _supabaseChecked = false;
async function ensureSupabaseOrMock(): Promise<void> {
  if (USE_MOCK || _supabaseChecked) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'apikey': env.VITE_SUPABASE_ANON_KEY }
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.warn('Supabase responded with error, switching to mock mode');
      USE_MOCK = true;
    }
  } catch {
    console.warn('Supabase unreachable, switching to mock mode');
    USE_MOCK = true;
  } finally {
    _supabaseChecked = true;
  }
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
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 600)); // Simulate latency
      return mockProfile;
    }
    
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;

    const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if (error && error.code !== 'PGRST116') throw error; // Ignore no rows found for new users
    
    // Fallback if profile doesn't exist yet but user is auth'd
    return data || { 
      id: user.id, 
      email: user.email || '', 
      full_name: user.user_metadata.full_name || 'Utilisateur', 
      role: 'vdi' 
    };
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

  async getProducts(): Promise<Product[]> {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockProducts;
    }
    const { data, error } = await getSupabase().from('products').select('*').order('name');
    if (error) throw error;
    return data;
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
        const newProduct = { ...product, id: `p_${Date.now()}_${Math.random()}` };
        mockProducts.push(newProduct);
        return newProduct;
    }
    const { data, error } = await getSupabase().from('products').insert(product).select().single();
    if (error) throw error;
    return data;
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
    if (USE_MOCK) {
        const idx = mockProducts.findIndex(p => p.id === productId);
        if (idx !== -1) mockProducts[idx].stock_quantity = newQuantity;
        return;
    }
    await getSupabase().from('products').update({ stock_quantity: newQuantity }).eq('id', productId);
  },

  async getClients(): Promise<Client[]> {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return mockClients;
    }
    const { data, error } = await getSupabase().from('clients').select('*').order('full_name');
    if (error) throw error;
    return data;
  },

  async addClient(client: Omit<Client, 'id' | 'user_id'>): Promise<Client> {
      await ensureSupabaseOrMock();
      if (USE_MOCK) {
          const newClient = { ...client, id: `c_${Date.now()}`, user_id: 'user_123' };
          mockClients.push(newClient);
          return newClient;
      }
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      const { data, error } = await sb.from('clients').insert({...client, user_id: user?.id}).select().single();
      if (error) throw error;
      return data;
  },

  async updateClient(client: Client): Promise<void> {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
        const idx = mockClients.findIndex(c => c.id === client.id);
        if (idx !== -1) mockClients[idx] = client;
        return;
    }
    const { error } = await getSupabase().from('clients').update(client).eq('id', client.id);
    if (error) throw error;
  },

  async getOrders(): Promise<Order[]> {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockOrders;
    }
    const { data, error } = await getSupabase().from('orders').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createOrder(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    await ensureSupabaseOrMock();
    if (USE_MOCK) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const newOrder = {
            ...order,
            id: `ord_${Date.now()}`,
            created_at: new Date().toISOString()
        };
        mockOrders.unshift(newOrder); 
        
        // Mock Stock update
        order.items.forEach(item => {
            const prod = mockProducts.find(p => p.id === item.id);
            if(prod) prod.stock_quantity -= item.quantity;
        });
        return newOrder;
    }
    
    // 1. Insert Order
    const { data: orderData, error: orderError } = await getSupabase()
        .from('orders')
        .insert({
            client_id: order.client_id,
            total_amount: order.total_amount,
            profit: order.profit,
            status: order.status,
            payment_status: order.payment_status
        })
        .select()
        .single();

    if (orderError) throw orderError;

    // 2. Insert Items (Conceptual - requires order_items table in real DB)
    // const itemsData = order.items.map(item => ({ order_id: orderData.id, product_id: item.id, quantity: item.quantity }));
    // await supabase.from('order_items').insert(itemsData);

    return orderData;
  }
};