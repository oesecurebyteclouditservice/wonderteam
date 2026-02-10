import React, { useEffect, useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingBag, ArrowRight, Package, AlertTriangle, ChevronRight } from 'lucide-react';
import { DataService } from '../services/dataService';
import { AuthContext } from '../App';
import { Order, ViewState, Product, Client } from '../types';

interface DashboardProps {
    onViewChange: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ revenue: 0, profit: 0, newClients: 0, totalOrders: 0, lowStock: 0, totalStockValue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [clientMap, setClientMap] = useState<Record<string, Client>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try RPC first, fall back to manual calc
        const [dashStats, orders, clients, prods] = await Promise.all([
          DataService.getDashboardStats(),
          DataService.getOrders(),
          DataService.getClients(),
          DataService.getProducts()
        ]);

        setRecentOrders(orders.slice(0, 5));
        setProducts(prods);

        const cMap: Record<string, Client> = {};
        clients.forEach(c => cMap[c.id] = c);
        setClientMap(cMap);

        if (dashStats && dashStats.total_revenue !== undefined) {
          setStats({
            revenue: dashStats.total_revenue,
            profit: dashStats.total_profit,
            newClients: clients.filter(c => c.status === 'new').length,
            totalOrders: dashStats.total_orders,
            lowStock: dashStats.low_stock_count,
            totalStockValue: dashStats.total_stock_value
          });
        } else {
          // Fallback: calculate from raw data
          const revenue = orders.reduce((acc, o) => acc + o.total_amount, 0);
          const profit = orders.reduce((acc, o) => acc + o.profit, 0);
          const newClients = clients.filter(c => c.status === 'new').length;
          const lowStock = prods.filter(p => p.stock_quantity <= p.alert_threshold).length;
          const totalStockValue = prods.reduce((acc, p) => acc + (p.stock_quantity * p.price_public), 0);

          setStats({
            revenue,
            profit,
            newClients,
            totalOrders: orders.length,
            lowStock,
            totalStockValue
          });
        }
      } catch (e) {
        console.error('Dashboard: Failed to load stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Build category distribution from products
  const categoryData = React.useMemo(() => {
    const catMap: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'Autre';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    return Object.entries(catMap).map(([name, value]) => ({ name, value }));
  }, [products]);

  const PIE_COLORS = ['#e11d48', '#fcd34d', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">
                Bonjour, <span className="text-rose-600">{user?.full_name?.split(' ')[0] || 'Utilisateur'}</span>
            </h2>
            <p className="text-slate-500">Voici vos performances de la semaine.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
            title="Chiffre d'Affaires"
            value={`${(stats.revenue ?? 0).toFixed(2)}€`}
            icon={<TrendingUp className="text-rose-600" size={20} />}
            bg="bg-rose-50"
            onClick={() => onViewChange('finance')}
        />
        <StatCard
            title="Benefice Net"
            value={`${(stats.profit ?? 0).toFixed(2)}€`}
            icon={<ShoppingBag className="text-amber-500" size={20} />}
            bg="bg-amber-50"
            onClick={() => onViewChange('finance')}
        />
        <StatCard
            title="Nouveaux Clients"
            value={`+${stats.newClients}`}
            icon={<Users className="text-slate-600" size={20} />}
            bg="bg-slate-50"
            label="Clients"
            onClick={() => onViewChange('clients')}
        />
        <StatCard
            title="Commandes"
            value={`${stats.totalOrders}`}
            icon={<ShoppingBag className="text-blue-600" size={20} />}
            bg="bg-blue-50"
            label="Total"
            onClick={() => onViewChange('orders')}
        />
      </div>

      {/* Stock Widget - Interactive */}
      <div
        onClick={() => onViewChange('stock')}
        className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-8 cursor-pointer hover:shadow-md transition-shadow group"
      >
          <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Package size={20} />
                  </div>
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">Etat des Stocks</h3>
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-indigo-600" />
          </div>

          <div className="flex items-end justify-between">
              <div>
                  <p className="text-xs text-slate-500 mb-1">Produits en alerte</p>
                  <p className={`text-3xl font-bold ${stats.lowStock > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                      {stats.lowStock}
                  </p>
              </div>
              <div className="text-right">
                   <p className="text-xs text-slate-500 mb-1">Valeur totale</p>
                   <p className="text-xl font-bold text-slate-800">{(stats.totalStockValue ?? 0).toFixed(0)}€</p>
              </div>
          </div>
      </div>

      {/* Distribution */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-8">
            <h3 className="font-semibold text-slate-800 mb-4">Repartition par Categorie</h3>
            <div className="h-48 flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                       <Pie data={categoryData} innerRadius={60} outerRadius={80} dataKey="value">
                           {categoryData.map((_, idx) => (
                               <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                           ))}
                       </Pie>
                       <Tooltip />
                   </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
                {categoryData.map((cat, idx) => (
                    <div key={cat.name} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                        {cat.name} ({cat.value})
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800">Commandes Recentes</h3>
          <button onClick={() => onViewChange('orders')} className="text-xs font-bold text-rose-600 hover:text-rose-700">Tout voir</button>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-4 text-xs font-bold text-slate-500 uppercase flex justify-between border-b border-slate-50">
              <span>Date</span>
              <span>Client</span>
              <span>Total</span>
              <span>Statut</span>
              <span>Paiement</span>
          </div>
          {recentOrders.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">Aucune commande.</div>
          ) : (
              recentOrders.map(order => {
                  const client = clientMap[order.client_id];
                  return (
                      <div key={order.id} className="p-4 flex justify-between items-center text-sm hover:bg-slate-50 border-t border-slate-50">
                          <span className="font-mono text-slate-500">{new Date(order.created_at).toLocaleDateString()}</span>
                          <span className="font-bold text-slate-800">{client?.full_name || 'Client'}</span>
                          <span className="font-bold">{(order.total_amount ?? 0).toFixed(2)}€</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                          }`}>
                              {order.status === 'delivered' ? 'Livre' : order.status === 'shipped' ? 'Expedie' : order.status}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                              order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                              {order.payment_status === 'paid' ? 'Payee' : 'En attente'}
                          </span>
                      </div>
                  );
              })
          )}
      </div>

    </div>
  );
};

const StatCard = ({ title, value, icon, trend, bg, label, onClick }: { title: string, value: string, icon: React.ReactNode, trend?: string, bg: string, label?: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`p-4 rounded-xl ${bg} flex flex-col justify-between h-32 relative overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-95`}
    >
        <div className="flex justify-between items-start z-10">
            <div className="p-2 bg-white rounded-full shadow-sm">{icon}</div>
            {trend ? (
                <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-full">{trend}</span>
            ) : label ? (
                <span className="text-[10px] font-bold text-slate-500 bg-white/50 px-2 py-1 rounded-full">{label}</span>
            ) : null}
        </div>
        <div className="z-10">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export default Dashboard;
