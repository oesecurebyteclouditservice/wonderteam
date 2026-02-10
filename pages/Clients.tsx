import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { GeminiService } from '../services/geminiService';
import { Client, Product } from '../types';
import { Search, Sparkles, UserPlus, Phone, Mail, Edit2, Save, X, Trash2, Users } from 'lucide-react';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [recommendation, setRecommendation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
      try {
        const [c, p] = await Promise.all([
          DataService.getClients(),
          DataService.getProducts()
        ]);
        setClients(c);
        setProducts(p);
      } catch (e) {
        console.error('Clients: Failed to load data', e);
      } finally {
        setLoading(false);
      }
  };

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleGenerateAi = async (client: Client) => {
      setSelectedClient(client);
      setRecommendation("");
      setAiLoading(true);
      try {
        const recs = await GeminiService.generateProductRecommendations(client, products);
        setRecommendation(recs.join(', '));
      } catch (e) {
        console.error('AI recommendation failed', e);
        setRecommendation("Impossible de générer une recommandation pour le moment.");
      } finally {
        setAiLoading(false);
      }
  };

  const startEdit = (client: Client) => {
      setEditingId(client.id);
      setEditForm(client);
  };

  const saveEdit = async () => {
      if (editForm.id) {
          try {
              await DataService.updateClient(editForm as Client);
              setEditingId(null);
              loadData();
          } catch (e) {
              console.error('Clients: Failed to save edit', e);
          }
      }
  };

  const handleAddClient = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const form = e.target as HTMLFormElement;
          const newClient = {
              full_name: (form.elements.namedItem('firstName') as HTMLInputElement).value + ' ' + (form.elements.namedItem('lastName') as HTMLInputElement).value,
              email: (form.elements.namedItem('email') as HTMLInputElement).value,
              phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
              status: 'new' as const,
              notes: ''
          };
          await DataService.addClient(newClient);
          setIsAddModalOpen(false);
          loadData();
      } catch (e) {
          console.error('Clients: Failed to add client', e);
      }
  };

  return (
    <div className="p-4 pt-8 pb-24">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif font-bold text-slate-900">Suivi Clients</h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700 transition shadow-lg shadow-rose-200"
          >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Ajouter</span>
          </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users size={40} className="mx-auto mb-2 opacity-50" />
          <p>{search ? 'Aucun client trouvé.' : 'Aucun client enregistré.'}</p>
        </div>
      ) : (
      <div className="space-y-4">
          {filtered.map(client => {
              const isEditing = editingId === client.id;
              return (
              <div key={client.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                           {isEditing ? (
                               <input 
                                    className="font-bold text-slate-800 border-b border-rose-300 bg-white focus:outline-none w-full" 
                                    value={editForm.full_name} 
                                    onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                               />
                           ) : (
                               <h3 className="font-bold text-slate-800 text-lg">{client.full_name}</h3>
                           )}
                           <div className="text-xs text-slate-400 mt-0.5">{client.email}</div>
                      </div>

                      {isEditing ? (
                           <select 
                                className="text-xs font-bold uppercase p-1 rounded bg-slate-100 border-none text-slate-800"
                                value={editForm.status}
                                onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                           >
                               <option value="new">Nouveau</option>
                               <option value="active">Actif</option>
                               <option value="vip">VIP</option>
                               <option value="relance">À relancer</option>
                               <option value="inactive">Inactif</option>
                           </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            client.status === 'vip' ? 'bg-amber-100 text-amber-700' : 
                            client.status === 'new' ? 'bg-blue-100 text-blue-700' : 
                            client.status === 'relance' ? 'bg-rose-100 text-rose-700' : // Visual for 'À relancer'
                            client.status === 'active' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-500'
                        }`}>
                            {client.status === 'relance' ? 'À relancer' : client.status}
                        </span>
                      )}

                      <div className="ml-2 flex gap-1">
                          {isEditing ? (
                              <>
                                <button onClick={saveEdit} className="text-green-600 p-1 hover:bg-green-50 rounded"><Save size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="text-red-400 p-1 hover:bg-red-50 rounded"><X size={16}/></button>
                              </>
                          ) : (
                              <>
                                <button onClick={() => startEdit(client)} className="text-slate-400 p-1 hover:text-rose-600 hover:bg-rose-50 rounded"><Edit2 size={16} /></button>
                                <button
                                  onClick={async () => {
                                    if (!confirm('Supprimer ce client ?')) return;
                                    try {
                                      await DataService.deleteClient(client.id);
                                      loadData();
                                    } catch (e) {
                                      console.error('Failed to delete client', e);
                                    }
                                  }}
                                  className="text-slate-400 p-1 hover:text-red-500 hover:bg-red-50 rounded"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                          )}
                      </div>
                  </div>
                  
                  {/* Contact Info (Editable) */}
                  <div className="flex flex-col gap-2 mb-3 bg-slate-50 p-3 rounded-lg">
                       <div className="flex items-center gap-2 text-sm text-slate-600">
                           <Phone size={14} className="text-slate-400"/>
                           {isEditing ? (
                               <input 
                                    className="bg-white border-b border-slate-300 w-full focus:outline-none text-slate-800"
                                    value={editForm.phone}
                                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                               />
                           ) : client.phone}
                       </div>
                       <div className="flex items-center gap-2 text-sm text-slate-600">
                           <Mail size={14} className="text-slate-400"/>
                           {isEditing ? (
                               <input 
                                    className="bg-white border-b border-slate-300 w-full focus:outline-none text-slate-800"
                                    value={editForm.email}
                                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                               />
                           ) : client.email}
                       </div>
                  </div>
                  
                  {/* Notes */}
                  {(client.notes || isEditing) && (
                      <div className="mb-3">
                          {isEditing ? (
                              <textarea 
                                  className="w-full text-xs text-slate-800 bg-white p-2 rounded border border-slate-200 focus:outline-none focus:border-rose-300"
                                  value={editForm.notes}
                                  placeholder="Notes sur le client..."
                                  onChange={e => setEditForm({...editForm, notes: e.target.value})}
                              />
                          ) : (
                              <p className="text-xs text-slate-500 italic">"{client.notes}"</p>
                          )}
                      </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                     <span className="text-[10px] text-slate-400">Dernière commande: {client.last_purchase_date || 'Jamais'}</span>
                     <button 
                        onClick={() => handleGenerateAi(client)}
                        className="flex items-center gap-1 text-rose-600 text-xs font-bold hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                     >
                        <Sparkles size={14} />
                        Générer une recommandation
                     </button>
                  </div>
              </div>
          )})}
      </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-md rounded-2xl p-6 relative">
                   <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                       <X size={24} />
                   </button>
                   <h2 className="text-xl font-bold mb-4 text-slate-900">Nouveau Client</h2>
                   <form onSubmit={handleAddClient} className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <input name="firstName" placeholder="Prénom" required className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                           <input name="lastName" placeholder="Nom" required className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                       </div>
                       <input name="email" type="email" placeholder="Email" required className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                       <input name="phone" type="tel" placeholder="Téléphone" className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                       <button type="submit" className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition">
                           Enregistrer
                       </button>
                   </form>
              </div>
          </div>
      )}

      {/* AI Modal (Existing) */}
      {selectedClient && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                  <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-4 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <Sparkles className="animate-pulse" />
                          <span className="font-serif font-bold">Coach IA pour {selectedClient.full_name.split(' ')[0]}</span>
                      </div>
                      <button onClick={() => setSelectedClient(null)} className="text-white/80 hover:text-white">Fermer</button>
                  </div>
                  <div className="p-6 min-h-[200px]">
                      {aiLoading ? (
                          <div className="space-y-3">
                              <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                              <div className="h-4 bg-slate-100 rounded w-full animate-pulse"></div>
                              <div className="h-4 bg-slate-100 rounded w-5/6 animate-pulse"></div>
                              <p className="text-center text-xs text-slate-400 mt-4">Analyse du profil et du stock en cours...</p>
                          </div>
                      ) : (
                          <div className="prose prose-sm prose-rose">
                              <p className="whitespace-pre-line text-slate-700">{recommendation}</p>
                          </div>
                      )}
                  </div>
                  {!aiLoading && (
                      <div className="p-4 border-t border-slate-100 bg-slate-50">
                          <button onClick={() => { alert("Copié !"); setSelectedClient(null); }} className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium">
                              Copier le message
                          </button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Clients;