import React, { useEffect, useState, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingBag, ArrowRight, Package, AlertTriangle, ChevronRight } from 'lucide-react';
import { DataService } from '../services/dataService';
import { AuthContext } from '../App';
import { Order, ViewState, Product } from '../types';

interface DashboardProps {
    onViewChange: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ revenue: 0, profit: 0, newClients: 0, totalOrders: 0, lowStock: 0, totalStockValue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const orders = await DataService.getOrders();
        const clients = await DataService.getClients();
        const products = await DataService.getProducts();

        // Calculate Metrics
        const revenue = orders.reduce((acc, o) => acc + o.total_amount, 0);
        const profit = orders.reduce((acc, o) => acc + o.profit, 0);
        const newClients = clients.filter(c => c.status === 'new').length;
        const lowStock = products.filter(p => p.stock_quantity <= p.alert_threshold).length;
        const totalStockValue = products.reduce((acc, p) => acc + (p.stock_quantity * p.price_public), 0);

        setStats({
          revenue,
          profit,
          newClients,
          totalOrders: orders.length,
          lowStock,
          totalStockValue
        });
      } catch (e) {
        console.error('Dashboard: Failed to load stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const data = [
    { name: 'Lun', sales: 120 },
    { name: 'Mar', sales: 200 },
    { name: 'Mer', sales: 150 },
    { name: 'Jeu', sales: 300 },
    { name: 'Ven', sales: 250 },
    { name: 'Sam', sales: 400 },
    { name: 'Dim', sales: 180 },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-serif font-bold text-slate-900">
                Bonjour, <span className="text-rose-600">{user?.full_name.split(' ')[0]}</span>
            </h2>
            <p className="text-slate-500">Voici vos performances de la semaine.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard 
            title="Chiffre d'Affaires" 
            value={`${stats.revenue.toFixed(2)}€`} 
            icon={<TrendingUp className="text-rose-600" size={20} />}
            trend="+12%"
            bg="bg-rose-50"
            onClick={() => onViewChange('finance')}
        />
        <StatCard 
            title="Bénéfice Net" 
            value={`${stats.profit.toFixed(2)}€`} 
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
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">État des Stocks</h3>
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
                   <p className="text-xl font-bold text-slate-800">{stats.totalStockValue.toFixed(0)}€</p>
              </div>
          </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-8">
        <h3 className="font-semibold text-slate-800 mb-4">Ventes par jour</h3>
        <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#fff1f2'}}
                    />
                    <Bar dataKey="sales" fill="#e11d48" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution (Mock) */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-8">
          <h3 className="font-semibold text-slate-800 mb-4">Répartition</h3>
          <div className="h-48 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                     <Pie data={[{name: 'Parfums', value: 70}, {name: 'Soins', value: 30}]} innerRadius={60} outerRadius={80} dataKey="value">
                         <Cell fill="#e11d48" />
                         <Cell fill="#fcd34d" />
                     </Pie>
                     <Tooltip />
                 </PieChart>
             </ResponsiveContainer>
             <div className="absolute text-center pointer-events-none">
                 <p className="text-2xl font-bold text-slate-800">70%</p>
                 <p className="text-xs text-slate-400">Parfums</p>
             </div>
          </div>
          <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-600"></div> Parfums</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Soins</div>
          </div>
      </div>

      {/* Recent Orders - Just a Title for now */}
      <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800">Commandes Récentes</h3>
          <button onClick={() => onViewChange('orders')} className="text-xs font-bold text-rose-600 hover:text-rose-700">Tout voir</button>
      </div>
      {/* List would go here, reusing Orders component logic or a simplified version */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-4 text-xs font-bold text-slate-500 uppercase flex justify-between border-b border-slate-50">
              <span>Num Cmd</span>
              <span>Client</span>
              <span>Total</span>
              <span>Statut</span>
              <span>Paiement</span>
          </div>
          {/* Mock data row */}
          <div className="p-4 flex justify-between items-center text-sm hover:bg-slate-50">
              <span className="font-mono text-slate-500">CMD-2023-8492</span>
              <span className="font-bold text-slate-800">Sophie Martin</span>
              <span className="font-bold">85€</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Livré</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Payée</span>
          </div>
           <div className="p-4 flex justify-between items-center text-sm hover:bg-slate-50 border-t border-slate-50">
              <span className="font-mono text-slate-500">CMD-2023-7391</span>
              <span className="font-bold text-slate-800">Lucas Bernard</span>
              <span className="font-bold">130€</span>
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">Expédié</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Payée</span>
          </div>
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