import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  User,
  LogOut,
  Loader2,
  ShoppingCart,
  Package,
  FileText,
  PieChart,
  Menu,
  X
} from 'lucide-react';
import { DataService } from './services/dataService';
import { supabase } from './services/supabase';
import { Profile, ViewState, CartItem, Product } from './types';

// Login is eagerly loaded (first screen seen by unauthenticated users)
import Login from './pages/Login';

// Lazy-loaded pages (code-split)
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Catalog = React.lazy(() => import('./pages/Catalog'));
const Stock = React.lazy(() => import('./pages/Stock'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Finance = React.lazy(() => import('./pages/Finance'));
const POS = React.lazy(() => import('./pages/POS'));
const Clients = React.lazy(() => import('./pages/Clients'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

// Loading fallback for Suspense
const LoadingFallback: React.FC = () => (
  <div className="flex-1 flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
  </div>
);

// --- Contexts ---
interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  total: number;
}
export const CartContext = createContext<CartContextType>({} as CartContextType);

const App: React.FC = () => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('login');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Check - skip network calls if no session token exists
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Quick check: if no Supabase auth token in storage, go straight to login
        const hasSession = Object.keys(localStorage).some(k => k.startsWith('sb-'));
        if (!hasSession && (import.meta as any).env?.VITE_SUPABASE_URL) {
          setCurrentView('login');
          setLoading(false);
          return;
        }
        // Race the profile fetch against a 2s deadline so the UI never hangs
        const profile = await Promise.race([
          DataService.getProfile(),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 2000))
        ]);
        if (profile) {
            setUser(profile);
            setCurrentView('dashboard');
        } else {
            setCurrentView('login');
        }
      } catch (e) {
        console.error("Auth check failed", e);
        setCurrentView('login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    // Listen for auth state changes (handles OAuth redirect callback)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session) {
            try {
              const profile = await DataService.getProfile();
              if (profile) {
                setUser(profile);
                setCurrentView('dashboard');
              }
            } catch (e) {
              console.error("Profile fetch after OAuth sign-in failed", e);
            } finally {
              setLoading(false);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setCurrentView('login');
          }
        }
      );
      return () => { subscription.unsubscribe(); };
    }
  }, []);

  const handleLogin = async () => {
      setLoading(true);
      try {
        const profile = await DataService.getProfile();
        setUser(profile);
        setCurrentView('dashboard');
      } catch (e) {
        console.error("Login failed", e);
        setCurrentView('login');
      } finally {
        setLoading(false);
      }
  };

  const handleLogout = () => {
      setUser(null);
      setCurrentView('login');
  };

  // Cart Logic
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price_public * item.quantity), 0);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-rose-50 text-rose-600">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="font-serif text-xl">Chargement de Wonder Team...</p>
      </div>
    );
  }

  // --- Navigation Items Configuration ---
  const navItems = [
      { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
      { id: 'catalog', label: 'Vente', icon: ShoppingBag },
      { id: 'stock', label: 'Stock', icon: Package },
      { id: 'orders', label: 'Commandes', icon: FileText },
  ];

  const secondaryNavItems = [
      { id: 'finance', label: 'Finance', icon: PieChart },
      { id: 'clients', label: 'Clients', icon: Users },
      { id: 'profile', label: 'Mon Espace', icon: User },
  ];

  const handleNavClick = (view: ViewState) => {
      setCurrentView(view);
      setMobileMenuOpen(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, logout: handleLogout }}>
      <CartContext.Provider value={{ items: cartItems, addToCart, removeFromCart, clearCart, total: cartTotal }}>
        
        {currentView === 'login' ? (
          <Login />
        ) : (
          <div className="min-h-screen bg-slate-50 flex">
            
            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
                <div className="p-6">
                    <h1 className="font-serif text-2xl font-bold text-rose-600 flex items-center gap-2">
                        <span className="text-3xl">✨</span> Wonder Team
                    </h1>
                </div>

                <div className="flex-1 px-4 space-y-6 overflow-y-auto">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Menu Principal</p>
                        <nav className="space-y-1">
                            {navItems.map(item => (
                                <SidebarLink 
                                    key={item.id} 
                                    active={currentView === item.id} 
                                    onClick={() => handleNavClick(item.id as ViewState)} 
                                    icon={item.icon} 
                                    label={item.label} 
                                />
                            ))}
                        </nav>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Gestion</p>
                        <nav className="space-y-1">
                            {secondaryNavItems.map(item => (
                                <SidebarLink 
                                    key={item.id} 
                                    active={currentView === item.id} 
                                    onClick={() => handleNavClick(item.id as ViewState)} 
                                    icon={item.icon} 
                                    label={item.label} 
                                />
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-slate-500 hover:text-red-500 hover:bg-red-50 w-full px-4 py-3 rounded-lg transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        Se déconnecter
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col min-h-screen relative max-w-full overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-40">
                    <span className="font-serif font-bold text-lg text-slate-800">Wonder Team</span>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </header>

                {/* Mobile Drawer Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-50 bg-white pt-20 px-6 space-y-6">
                         <div className="space-y-2">
                            {[...navItems, ...secondaryNavItems].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id as ViewState)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl text-lg font-medium ${currentView === item.id ? 'bg-rose-50 text-rose-600' : 'text-slate-600'}`}
                                >
                                    <item.icon size={24} />
                                    {item.label}
                                </button>
                            ))}
                             <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 p-4 rounded-xl text-lg font-medium text-red-500 bg-red-50 mt-8"
                            >
                                <LogOut size={24} />
                                Se déconnecter
                            </button>
                         </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
                  <React.Suspense fallback={<LoadingFallback />}>
                    {currentView === 'dashboard' && <Dashboard onViewChange={setCurrentView} />}
                    {currentView === 'catalog' && <Catalog />}
                    {currentView === 'stock' && <Stock />}
                    {currentView === 'orders' && <Orders />}
                    {currentView === 'finance' && <Finance />}
                    {currentView === 'pos' && <POS />}
                    {currentView === 'clients' && <Clients />}
                    {currentView === 'profile' && <ProfilePage />}
                  </React.Suspense>
                </main>

                {/* --- MOBILE BOTTOM NAV --- */}
                <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 pb-safe">
                    <div className="flex justify-around items-center py-2">
                        <NavButton 
                            active={currentView === 'dashboard'} 
                            onClick={() => setCurrentView('dashboard')} 
                            icon={<LayoutDashboard size={20} />} 
                            label="Accueil" 
                        />
                        <NavButton 
                            active={currentView === 'catalog'} 
                            onClick={() => setCurrentView('catalog')} 
                            icon={<ShoppingBag size={20} />} 
                            label="Vente" 
                        />
                        
                        {/* Cart Button (Floating Style) */}
                        <div className="relative -top-5">
                            <button 
                                onClick={() => setCurrentView('pos')}
                                className={`p-4 rounded-full shadow-xl border-4 border-slate-50 transition-transform active:scale-95 ${
                                    currentView === 'pos' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'
                                }`}
                            >
                                <ShoppingCart size={24} />
                            </button>
                            {cartItems.length > 0 && (
                                <span className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                                    {cartItems.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </div>

                        <NavButton 
                            active={currentView === 'stock'} 
                            onClick={() => setCurrentView('stock')} 
                            icon={<Package size={20} />} 
                            label="Stock" 
                        />
                        <NavButton 
                            active={currentView === 'orders'} 
                            onClick={() => setCurrentView('orders')} 
                            icon={<FileText size={20} />} 
                            label="Cmds" 
                        />
                    </div>
                </nav>
            </div>
          </div>
        )}
      </CartContext.Provider>
    </AuthContext.Provider>
  );
};

// Sub-components
interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 p-2 transition-colors ${active ? 'text-rose-600 font-medium' : 'text-slate-400'}`}
  >
    {icon}
    <span className="text-[10px] uppercase tracking-wide">{label}</span>
  </button>
);

interface SidebarLinkProps {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ active, onClick, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            active
            ? 'bg-rose-50 text-rose-700 font-bold'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
        <Icon size={20} />
        {label}
    </button>
);

// --- Error Boundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-rose-50 text-slate-700 p-8">
          <div className="text-5xl mb-4">&#9888;</div>
          <h1 className="font-serif text-2xl font-bold text-rose-600 mb-2">Une erreur est survenue</h1>
          <p className="text-slate-500 mb-6 text-center max-w-md">
            L'application a rencontré un problème. Veuillez rafraîchir la page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition"
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppWithErrorBoundary: React.FC = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;