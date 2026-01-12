import React, { useContext, useState } from 'react';
import { CartContext } from '../App';
import { DataService } from '../services/dataService';
import { Trash2, CreditCard, Banknote, CheckCircle2, Copy, X, Wallet } from 'lucide-react';
import { Order } from '../types';

const POS: React.FC = () => {
  const { items, removeFromCart, total, clearCart } = useContext(CartContext);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [paymentMethodName, setPaymentMethodName] = useState<string>('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const profit = items.reduce((acc, item) => acc + ((item.price_public - item.price_cost) * item.quantity), 0);

  const handleCashPayment = async () => {
    // Create order immediately
    await createOrder('paid');
    setOrderSuccess(true);
    setTimeout(() => {
        setOrderSuccess(false);
        clearCart();
    }, 2000);
  };

  const handleLinkGeneration = async (type: 'stripe' | 'paypal') => {
    let link = '';
    if (type === 'stripe') {
        link = `https://pay.stripe.com/pl_${Math.random().toString(36).substr(2, 9)}`;
        setPaymentMethodName('Carte Bancaire (Stripe/SumUp)');
    } else {
        link = `https://paypal.me/wonderteam/${total.toFixed(2)}`;
        setPaymentMethodName('PayPal');
    }
    
    setPaymentLink(link);
    setPaymentModalOpen(true);
    
    // Create pending order
    await createOrder('pending');
  };

  const createOrder = async (status: 'paid' | 'pending') => {
      const orderData: Omit<Order, 'id' | 'created_at'> = {
          client_id: 'c_guest', // Simplified for MVP
          total_amount: total,
          profit: profit,
          status: 'pending',
          payment_status: status,
          items: items // In real DB, this would be a separate relation
      };
      await DataService.createOrder(orderData);
  };

  if (items.length === 0 && !orderSuccess) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Banknote size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-700">Votre panier est vide</h3>
              <p className="text-sm">Ajoutez des produits depuis le catalogue pour commencer une vente.</p>
          </div>
      );
  }

  if (orderSuccess) {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-green-50">
              <CheckCircle2 size={64} className="text-green-500 mb-4 animate-bounce" />
              <h2 className="text-2xl font-bold text-green-700">Vente Réussie !</h2>
              <p className="text-green-600">Le stock a été mis à jour.</p>
          </div>
      );
  }

  return (
    <div className="p-4 pt-8 h-full flex flex-col">
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Panier en cours</h2>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {items.map(item => (
            <div key={item.id} className="flex items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-slate-100 rounded-lg mr-4 overflow-hidden">
                    <img src={item.image_url} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-slate-500 font-bold uppercase">{item.brand}</p>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-sm text-rose-600 font-semibold">{item.price_public}€ x {item.quantity}</p>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-2">
                    <Trash2 size={18} />
                </button>
            </div>
        ))}
      </div>

      {/* Footer Totals */}
      <div className="border-t border-slate-100 pt-4 bg-white/80 backdrop-blur-sm sticky bottom-0">
          <div className="flex justify-between items-center mb-2 text-sm text-slate-500">
              <span>Marge estimée</span>
              <span className="text-amber-500 font-medium">+{profit.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-end mb-6">
              <span className="text-xl font-bold text-slate-800">Total à payer</span>
              <span className="text-3xl font-serif font-bold text-rose-600">{total.toFixed(2)}€</span>
          </div>

          <div className="space-y-3">
            {/* Online Payments Grid */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleLinkGeneration('stripe')}
                    className="flex flex-col items-center justify-center gap-1 bg-slate-800 text-white py-3 rounded-xl font-medium active:scale-95 transition-transform"
                >
                    <CreditCard size={20} />
                    <span className="text-xs">Lien CB</span>
                </button>
                <button 
                    onClick={() => handleLinkGeneration('paypal')}
                    className="flex flex-col items-center justify-center gap-1 bg-[#0070BA] text-white py-3 rounded-xl font-medium active:scale-95 transition-transform"
                >
                    <Wallet size={20} />
                    <span className="text-xs">PayPal</span>
                </button>
            </div>

            {/* Cash Payment (Primary) */}
            <button 
                onClick={handleCashPayment}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-rose-200 active:scale-95 transition-transform"
            >
                <Banknote size={24} />
                Encaisser (Espèces)
            </button>
          </div>
      </div>

      {/* Payment Link Modal */}
      {paymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 relative">
                  <button onClick={() => { setPaymentModalOpen(false); setPaymentLink(null); }} className="absolute top-4 right-4 text-slate-400">
                      <X size={24} />
                  </button>
                  
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      {paymentMethodName.includes('PayPal') ? <Wallet className="text-[#0070BA]" /> : <CreditCard className="text-rose-600" />}
                      Paiement à distance
                  </h3>

                  <div className="space-y-4">
                      <p className="text-sm text-slate-600">
                          Envoyez ce lien à votre cliente pour un paiement via <span className="font-bold">{paymentMethodName}</span>.
                      </p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 break-all text-xs font-mono text-slate-600 select-all">
                          {paymentLink}
                      </div>
                      <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition">
                          <Copy size={16} /> Copier le lien
                      </button>
                      <p className="text-xs text-slate-400 text-center">
                          La commande est enregistrée "En attente".
                      </p>
                      <button onClick={() => { clearCart(); setPaymentModalOpen(false); }} className="w-full text-rose-600 font-medium py-2">
                          Terminer
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default POS;