import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DataService } from '../services/dataService';
import { TrendingUp, ArrowLeft, DollarSign, PieChart } from 'lucide-react';
import { Order, Client } from '../types';

type DetailView = 'overview' | 'revenue' | 'profit';

const Finance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, profit: 0, cost: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [view, setView] = useState<DetailView>('overview');

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const [ordersData, clientsData] = await Promise.all([
             DataService.getOrders(),
             DataService.getClients()
        ]);
        
        const clientMap: Record<string, Client> = {};
        clientsData.forEach(c => clientMap[c.id] = c);
        setClients(clientMap);

        const revenue = ordersData.reduce((acc, o) => acc + o.total_amount, 0);
        const profit = ordersData.reduce((acc, o) => acc + o.profit, 0);
        setStats({
            revenue,
            profit,
            cost: revenue - profit
        });
        setOrders(ordersData);
        setLoading(false);
    };
    fetchData();
  }, []);

  const data = [
      { name: 'S1', amt: 400 },
      { name: 'S2', amt: 300 },
      { name: 'S3', amt: 500 },
      { name: 'S4', amt: 200 },
  ];

  if (view === 'revenue') {
      return (
          <div className="p-4 pt-8 pb-20">
              <button onClick={() => setView('overview')} className="flex items-center gap-2 text-slate-500 mb-4 hover:text-slate-800">
                  <ArrowLeft size={20} /> Retour
              </button>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Détail du Chiffre d'Affaires</h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-12 p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                      <div className="col-span-3">Date</div>
                      <div className="col-span-3">N° Commande</div>
                      <div className="col-span-4">Client</div>
                      <div className="col-span-2 text-right">Montant</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                      {orders.map(order => (
                          <div key={order.id} className="grid grid-cols-12 p-4 text-sm items-center hover:bg-slate-50">
                              <div className="col-span-3 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</div>
                              <div className="col-span-3 font-mono text-xs">{order.id}</div>
                              <div className="col-span-4 font-medium text-slate-800">{clients[order.client_id]?.full_name || 'Client de passage'}</div>
                              <div className="col-span-2 text-right font-bold text-rose-600">{order.total_amount.toFixed(2)}€</div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'profit') {
      return (
          <div className="p-4 pt-8 pb-20">
               <button onClick={() => setView('overview')} className="flex items-center gap-2 text-slate-500 mb-4 hover:text-slate-800">
                  <ArrowLeft size={20} /> Retour
              </button>
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Détail du Bénéfice Net</h2>
              <p className="text-sm text-slate-500 mb-6 italic">Calcul = Vente - (Coût Achat + Charges)</p>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="grid grid-cols-12 p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                      <div className="col-span-3">Date</div>
                      <div className="col-span-3">N° Commande</div>
                      <div className="col-span-2 text-right">Vente</div>
                      <div className="col-span-2 text-right">Coût</div>
                      <div className="col-span-2 text-right">Bénéfice</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                      {orders.map(order => (
                          <div key={order.id} className="grid grid-cols-12 p-4 text-sm items-center hover:bg-slate-50">
                              <div className="col-span-3 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</div>
                              <div className="col-span-3 font-mono text-xs">{order.id}</div>
                              <div className="col-span-2 text-right font-medium">{order.total_amount.toFixed(2)}€</div>
                              <div className="col-span-2 text-right text-red-400">-{(order.total_amount - order.profit).toFixed(2)}€</div>
                              <div className="col-span-2 text-right font-bold text-green-600">+{order.profit.toFixed(2)}€</div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 pt-8 pb-20">
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Finance & Résultats</h2>

      {/* Main KPI */}
      <div 
        onClick={() => setView('profit')}
        className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm mb-6 cursor-pointer hover:shadow-md transition-all group"
      >
          <div className="flex justify-between items-start mb-4">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition">
                         <TrendingUp size={20} />
                    </div>
                    <p className="text-slate-500 font-bold uppercase tracking-wider text-sm">Bénéfice Net</p>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-4xl font-bold font-serif text-slate-900">{stats.profit.toFixed(2)}€</span>
                </div>
            </div>
          </div>
          <div className="text-xs text-slate-400">
              Revenus - (Coûts + Charges)
          </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8">
          <div 
            onClick={() => setView('revenue')}
            className="bg-white p-6 rounded-xl border border-blue-50 shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center justify-between group"
          >
              <div>
                  <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition">
                          <DollarSign size={18} />
                      </div>
                      <p className="text-sm text-slate-500 uppercase font-bold">Chiffre d'Affaires</p>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{stats.revenue.toFixed(2)}€</p>
                  <p className="text-xs text-slate-400 mt-1">Somme des ventes de marchandises</p>
              </div>
          </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Analyse Hebdomadaire</h3>
          <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip contentStyle={{borderRadius: '8px'}} cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="amt" fill="#e11d48" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default Finance;