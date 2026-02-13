import { supabase } from './supabase';
import { MOCK_PROFILE, INITIAL_PRODUCTS, INITIAL_CLIENTS, INITIAL_ORDERS, INITIAL_TRANSACTIONS } from './mockData';
import { Product, Client, Order, OrderItem, Transaction, Profile } from '../types';
import { authLogger, logAuthEvent, logAuthError, logAuthDebug } from './authLogger';

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
let _supabaseCheckPromise: Promise<void> | null = null;
async function ensureSupabaseOrMock(): Promise<void> {
  if (USE_MOCK || _supabaseChecked) return;
  // Deduplicate concurrent calls: reuse the same in-flight probe
  if (_supabaseCheckPromise) return _supabaseCheckPromise;
  _supabaseCheckPromise = _doSupabaseCheck();
  return _supabaseCheckPromise;
}

async function _doSupabaseCheck(): Promise<void> {
  // Check sessionStorage cache first to avoid re-probing on every page load
  try {
    const cached = sessionStorage.getItem('sb_probe');
    if (cached) {
      const { ok, ts } = JSON.parse(cached);
      // Cache valid for 5 minutes
      if (Date.now() - ts < 300_000) {
        if (!ok) USE_MOCK = true;
        _supabaseChecked = true;
        return;
      }
    }
  } catch { /* ignore storage errors */ }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    // Probe with HEAD for speed — smaller response, same reachability test
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/products?select=id&limit=0`, {
      method: 'HEAD',
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
    try { sessionStorage.setItem('sb_probe', JSON.stringify({ ok: res.ok, ts: Date.now() })); } catch {}
  } catch {
    console.warn('Supabase unreachable, switching to mock mode');
    USE_MOCK = true;
    try { sessionStorage.setItem('sb_probe', JSON.stringify({ ok: false, ts: Date.now() })); } catch {}
  } finally {
    _supabaseChecked = true;
    _supabaseCheckPromise = null;
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

  async signUpWithEmail(email: string, password: string, fullName: string) {
    authLogger.logLoginFlow('START: Email Sign-Up', { email, fullName });

    await ensureSupabaseOrMock();
    if (USE_MOCK) {
        logAuthDebug('Using MOCK mode for sign-up', { email }, 'DataService.signUpWithEmail');
        // Create a new mock profile for the session
        mockProfile = {
            ...MOCK_PROFILE,
            email: email,
            full_name: fullName,
            id: `user_${Date.now()}`
        };
        await new Promise(resolve => setTimeout(resolve, 800));
        authLogger.logLoginFlow('COMPLETE: Mock Sign-Up Success', { userId: mockProfile.id, email });
        return { data: { user: mockProfile }, error: null };
    }

    const sb = getSupabase();

    logAuthDebug('Calling Supabase auth.signUp', { email, fullName }, 'DataService.signUpWithEmail');
    const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    });

    if (error) {
        logAuthError('Sign-Up Failed', error, 'DataService.signUpWithEmail');
        authLogger.logLoginFlow('ERROR: Sign-Up Failed', { error: error.message });
        return { data, error };
    }

    logAuthEvent('Sign-Up Success', { userId: data.user?.id, email }, 'DataService.signUpWithEmail');

    // Automatically create profile entry if signup successful (handled by trigger usually, but good for safety)
    if (data.user && !error) {
        logAuthDebug('Creating profile entry in DB', { userId: data.user.id }, 'DataService.signUpWithEmail');
        const { error: profileError } = await sb.from('profiles').insert({
            id: data.user.id,
            email: email,
            full_name: fullName,
            role: 'vdi'
        });

        if (profileError) {
            logAuthError('Profile creation failed', profileError, 'DataService.signUpWithEmail');
        } else {
            logAuthEvent('Profile created successfully', { userId: data.user.id }, 'DataService.signUpWithEmail');
        }
    }

    authLogger.logLoginFlow('COMPLETE: Email Sign-Up', { userId: data.user?.id, email });
    return { data, error };
  },

  async signInWithEmail(email: string, password: string) {
      authLogger.logLoginFlow('START: Email Sign-In', { email });

      await ensureSupabaseOrMock();
      if (USE_MOCK) {
          logAuthDebug('Using MOCK mode for sign-in', { email }, 'DataService.signInWithEmail');
          // Allow any login in mock mode, just update email in profile
          mockProfile = { ...mockProfile, email };
          await new Promise(resolve => setTimeout(resolve, 800));
          authLogger.logLoginFlow('COMPLETE: Mock Sign-In Success', { userId: mockProfile.id, email });
          return { data: { user: mockProfile }, error: null };
      }

      logAuthDebug('Calling Supabase auth.signInWithPassword', { email }, 'DataService.signInWithEmail');
      const result = await getSupabase().auth.signInWithPassword({ email, password });

      if (result.error) {
          logAuthError('Sign-In Failed', result.error, 'DataService.signInWithEmail');
          authLogger.logLoginFlow('ERROR: Sign-In Failed', { email, error: result.error.message });
      } else {
          logAuthEvent('Sign-In Success', { userId: result.data.user?.id, email }, 'DataService.signInWithEmail');
          authLogger.logLoginFlow('COMPLETE: Email Sign-In', { userId: result.data.user?.id, email });
      }

      return result;
  },

  async signInWithGoogle() {
      authLogger.logLoginFlow('START: Google OAuth Sign-In', {});

      await ensureSupabaseOrMock();
      if (USE_MOCK) {
          logAuthDebug('Using MOCK mode for Google sign-in', {}, 'DataService.signInWithGoogle');
          mockProfile = { ...mockProfile, email: 'google@example.com', full_name: 'Google User' };
          await new Promise(resolve => setTimeout(resolve, 800));
          authLogger.logLoginFlow('COMPLETE: Mock Google Sign-In', { userId: mockProfile.id });
          return { data: { user: mockProfile }, error: null };
      }

      const redirectUrl = `${window.location.origin}/`;
      logAuthDebug('Initiating Google OAuth', { redirectTo: redirectUrl }, 'DataService.signInWithGoogle');

      const result = await getSupabase().auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: redirectUrl,
          }
      });

      if (result.error) {
          logAuthError('Google OAuth initiation failed', result.error, 'DataService.signInWithGoogle');
          authLogger.logLoginFlow('ERROR: Google OAuth Failed', { error: result.error.message });
      } else {
          logAuthEvent('Google OAuth redirect initiated', { redirectTo: redirectUrl }, 'DataService.signInWithGoogle');
          authLogger.logLoginFlow('REDIRECT: Google OAuth initiated', { redirectTo: redirectUrl });
      }

      return result;
  },

  async getProfile(): Promise<Profile | null> {
    logAuthDebug('Fetching user profile', {}, 'DataService.getProfile');

    await ensureSupabaseOrMock();
    const result = await withMockFallback(
      async () => {
        const sb = getSupabase();
        logAuthDebug('Calling Supabase auth.getUser', {}, 'DataService.getProfile');
        const { data: { user } } = await sb.auth.getUser();

        if (!user) {
          logAuthDebug('No authenticated user found', {}, 'DataService.getProfile');
          return null;
        }

        logAuthDebug('User found, fetching profile from DB', { userId: user.id }, 'DataService.getProfile');
        const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();

        if (error && error.code !== 'PGRST116') {
          logAuthError('Profile fetch error', error, 'DataService.getProfile');
          throw error;
        }

        const profile = data || {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata.full_name || 'Utilisateur',
          role: 'vdi'
        };

        logAuthEvent('Profile fetched successfully', { userId: profile.id, email: profile.email }, 'DataService.getProfile');
        return profile;
      },
      () => {
        logAuthDebug('Returning mock profile', {}, 'DataService.getProfile');
        return mockProfile;
      },
      true
    );

    return result;
  },

  // Ensure profile exists (create if needed) - used for OAuth flows
  async ensureProfile(user: any): Promise<Profile | null> {
    logAuthDebug('Ensuring profile exists', { userId: user?.id, email: user?.email }, 'DataService.ensureProfile');

    await ensureSupabaseOrMock();
    if (USE_MOCK) {
      logAuthDebug('Using MOCK mode for ensureProfile', {}, 'DataService.ensureProfile');
      mockProfile = {
        ...mockProfile,
        id: user.id,
        email: user.email || 'oauth@example.com',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Utilisateur OAuth'
      };
      logAuthEvent('Mock profile ensured', { userId: mockProfile.id }, 'DataService.ensureProfile');
      return mockProfile;
    }

    const sb = getSupabase();
    try {
      // Try to get existing profile
      logAuthDebug('Checking for existing profile', { userId: user.id }, 'DataService.ensureProfile');
      const { data: existingProfile, error: fetchError } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        logAuthEvent('Existing profile found', { userId: existingProfile.id, email: existingProfile.email }, 'DataService.ensureProfile');
        return existingProfile;
      }

      // Profile doesn't exist, create it
      if (fetchError?.code === 'PGRST116') {
        logAuthDebug('Profile not found, creating new profile', { userId: user.id }, 'DataService.ensureProfile');

        const newProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Utilisateur',
          role: 'vdi' as const
        };

        const { data: createdProfile, error: createError } = await sb
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          logAuthError('Failed to create profile in DB', createError, 'DataService.ensureProfile');
          // Return basic profile even if insert fails
          return newProfile;
        }

        logAuthEvent('New profile created successfully', { userId: createdProfile.id, email: createdProfile.email }, 'DataService.ensureProfile');
        return createdProfile;
      }

      logAuthError('Profile fetch error', fetchError, 'DataService.ensureProfile');
      throw fetchError;
    } catch (e: any) {
      logAuthError('ensureProfile error', e, 'DataService.ensureProfile');
      // Return minimal profile as fallback
      const fallbackProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || 'Utilisateur',
        role: 'vdi'
      };
      logAuthDebug('Returning fallback profile', { userId: fallbackProfile.id }, 'DataService.ensureProfile');
      return fallbackProfile;
    }
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await sb
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('name');
        if (error) throw error;
        return data;
      },
      () => mockProducts,
      true
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await sb
          .from('products')
          .insert({ ...product, user_id: user.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      mockFn,
      true
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

  async updateStock(productId: string, newQuantity: number, size?: '15ml' | '30ml' | '70ml'): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const updates: any = {};
        if (size === '15ml') {
          updates.stock_15ml = newQuantity;
        } else if (size === '30ml') {
          updates.stock_30ml = newQuantity;
        } else if (size === '70ml') {
          updates.stock_70ml = newQuantity;
        } else {
          updates.stock_total = newQuantity;
        }
        const { error } = await sb
          .from('products')
          .update(updates)
          .eq('id', productId)
          .eq('user_id', user.id);
        if (error) throw error;
      },
      () => {
        const idx = mockProducts.findIndex(p => p.id === productId);
        if (idx !== -1) {
          if (size === '15ml') {
            mockProducts[idx].stock_15ml = newQuantity;
          } else if (size === '30ml') {
            mockProducts[idx].stock_30ml = newQuantity;
          } else if (size === '70ml') {
            mockProducts[idx].stock_70ml = newQuantity;
          } else {
            mockProducts[idx].stock_total = newQuantity;
          }
          // Recalculate total
          mockProducts[idx].stock_total =
            mockProducts[idx].stock_15ml +
            mockProducts[idx].stock_30ml +
            mockProducts[idx].stock_70ml;
        }
      },
      true
    );
  },

  async updateProduct(product: Product): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { id, ...updates } = product;
        const { error } = await sb
          .from('products')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
      },
      () => {
        const idx = mockProducts.findIndex(p => p.id === product.id);
        if (idx !== -1) mockProducts[idx] = product;
      },
      true
    );
  },

  async deleteProduct(productId: string): Promise<void> {
    await ensureSupabaseOrMock();
    await withMockFallback(
      async () => {
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await sb
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('user_id', user.id);
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await sb
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('full_name');
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await sb
          .from('clients')
          .update(client)
          .eq('id', client.id)
          .eq('user_id', user.id);
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await sb
          .from('clients')
          .delete()
          .eq('id', clientId)
          .eq('user_id', user.id);
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await sb
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await sb
          .from('orders')
          .update(updates)
          .eq('id', orderId)
          .eq('user_id', user.id);
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await sb
          .from('orders')
          .delete()
          .eq('id', orderId)
          .eq('user_id', user.id);
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
        const sb = getSupabase();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // Verify the order belongs to the user first
        const { data: order } = await sb
          .from('orders')
          .select('id')
          .eq('id', orderId)
          .eq('user_id', user.id)
          .single();

        if (!order) throw new Error('Order not found or access denied');

        const { data, error } = await sb
          .from('order_items')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at');
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
