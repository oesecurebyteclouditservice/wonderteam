import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Order, Client } from '../types';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Truck, Box } from 'lucide-react';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
          const [ordersData, clientsData] = await Promise.all([
              DataService.getOrders(),
              DataService.getClients()
          ]);
          setOrders(ordersData);
          // Map clients for easy lookup
          const clientMap: Record<string, Client> = {};
          clientsData.forEach(c => clientMap[c.id] = c);
          setClients(clientMap);
        } catch (e) {
          console.error('Orders: Failed to load data', e);
        } finally {
          setLoading(false);
        }
    };
    loadData();
  }, []);

  const toggleExpand = (id: string) => {
      setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'delivered': return 'bg-green-100 text-green-700';
          case 'shipped': return 'bg-blue-100 text-blue-700';
          case 'paid': return 'bg-amber-100 text-amber-700';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'delivered': return <CheckCircle size={14} />;
          case 'shipped': return <Truck size={14} />;
          default: return <Clock size={14} />;
      }
  };

  const filteredOrders = orders.filter(o => 
    filter === 'all' || o.payment_status === filter
  );

  return (
    <div className="p-4 pt-8 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-slate-900">Commandes</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
                Tout
            </button>
            <button 
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
                En attente
            </button>
        </div>
      </div>

      <div className="space-y-4">
          {filteredOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                  <Box size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Aucune commande trouvée.</p>
              </div>
          ) : (
              filteredOrders.map(order => {
                  const client = clients[order.client_id] || { full_name: 'Client de passage' };
                  const isExpanded = expandedOrderId === order.id;

                  return (
                      <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                          <div 
                              onClick={() => toggleExpand(order.id)}
                              className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 text-lg">{client.full_name}</span>
                                        {order.payment_status === 'paid' && <CheckCircle size={14} className="text-green-500" />}
                                    </div>
                                    <p className="text-xs text-slate-400 font-mono">{new Date(order.created_at).toLocaleDateString()} • #{order.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-rose-600 text-lg">{order.total_amount.toFixed(2)}€</p>
                                    <p className="text-xs text-amber-500 font-medium">Marge: +{order.profit.toFixed(2)}€</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    {order.status}
                                </span>
                                <button className="text-xs font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1">
                                    {isExpanded ? 'Masquer' : 'Détails'} 
                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                              <div className="bg-slate-50 p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Contenu de la commande</h4>
                                  <div className="space-y-2">
                                      {order.items && order.items.length > 0 ? (
                                          order.items.map((item, idx) => (
                                              <div key={idx} className="flex justify-between items-center text-sm">
                                                  <div className="flex items-center gap-2">
                                                      <span className="bg-white w-6 h-6 flex items-center justify-center rounded border border-slate-200 text-xs font-bold">{item.quantity}x</span>
                                                      <span className="text-slate-700">{item.name}</span>
                                                  </div>
                                                  <span className="font-medium text-slate-600">{(item.price_public * item.quantity).toFixed(2)}€</span>
                                              </div>
                                          ))
                                      ) : (
                                          <p className="text-sm text-slate-400 italic">Détails des articles non disponibles.</p>
                                      )}
                                  </div>
                              </div>
                          )}
                      </div>
                  );
              })
          )}
      </div>
    </div>
  );
};

export default Orders;