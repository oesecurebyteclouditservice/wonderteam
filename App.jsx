import React, { useState, createContext } from 'react';
import { Home, Package, Users, ShoppingCart, Warehouse, DollarSign, User, Menu, X } from 'lucide-react';

// Pages
const Dashboard = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
        <div className="text-4xl mb-2">📦</div>
        <div className="text-2xl font-bold">125</div>
        <div className="text-sm opacity-90">Produits</div>
      </div>
      <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg">
        <div className="text-4xl mb-2">👥</div>
        <div className="text-2xl font-bold">48</div>
        <div className="text-sm opacity-90">Clients</div>
      </div>
      <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
        <div className="text-4xl mb-2">📊</div>
        <div className="text-2xl font-bold">89</div>
        <div className="text-sm opacity-90">Commandes</div>
      </div>
    </div>
    <div className="mt-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Activité récente</h2>
      <p className="text-gray-600">Aucune activité à afficher pour le moment.</p>
    </div>
  </div>
);

const Catalog = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">📦 Catalogue Produits</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 mb-4">Gestion du catalogue de produits cosmétiques</p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        + Ajouter un produit
      </button>
    </div>
  </div>
);

const Clients = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">👥 Clients</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 mb-4">Base de données clients et programme de fidélité</p>
      <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
        + Ajouter un client
      </button>
    </div>
  </div>
);

const Orders = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">🛒 Commandes</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 mb-4">Gestion des commandes et facturation</p>
      <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
        + Nouvelle commande
      </button>
    </div>
  </div>
);

const POS = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">💳 Point de Vente</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 mb-4">Interface de caisse pour vente rapide</p>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg">
          <p className="text-gray-500">Sélectionnez des produits</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-bold mb-4">Panier</h3>
          <p className="text-gray-500">Vide</p>
        </div>
      </div>
    </div>
  </div>
);

const Stock = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">📦 Gestion des Stocks</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 mb-4">Suivi des stocks et alertes de réapprovisionnement</p>
      <div className="mt-4">
        <div className="flex items-center gap-2 text-amber-600">
          <span>⚠️</span>
          <span>3 produits nécessitent un réapprovisionnement</span>
        </div>
      </div>
    </div>
  </div>
);

const Finance = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">💰 Finance</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-2">Revenus du mois</h3>
        <p className="text-3xl font-bold text-green-600">12 450 €</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-2">Marge bénéficiaire</h3>
        <p className="text-3xl font-bold text-blue-600">42%</p>
      </div>
    </div>
  </div>
);

const Profile = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">👤 Profil</h1>
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 mb-4">Gestion du compte utilisateur</p>
      <div className="space-y-4">
        <div>
          <label className="block font-bold mb-2">Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" defaultValue="admin@wonder-team.fr" />
        </div>
        <div>
          <label className="block font-bold mb-2">Nom complet</label>
          <input type="text" className="w-full border rounded px-3 py-2" defaultValue="Administrateur" />
        </div>
      </div>
    </div>
  </div>
);

// Application principale
export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'catalog', label: 'Catalogue', icon: Package },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'orders', label: 'Commandes', icon: ShoppingCart },
    { id: 'pos', label: 'Point de Vente', icon: DollarSign },
    { id: 'stock', label: 'Stock', icon: Warehouse },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'catalog': return <Catalog />;
      case 'clients': return <Clients />;
      case 'orders': return <Orders />;
      case 'pos': return <POS />;
      case 'stock': return <Stock />;
      case 'finance': return <Finance />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static w-64 bg-gradient-to-b from-purple-600 to-blue-600 text-white h-full transition-transform z-20`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8">🚀 Wonder Team</h1>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setCurrentPage(item.id); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  currentPage === item.id ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-6 left-6 right-6 text-sm opacity-75">
          <p>✅ Supabase connecté</p>
          <p>✅ Gemini AI actif</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="text-xl font-bold">Wonder Team - Gestion Cosmétiques</div>
          <div className="text-sm text-gray-600">
            {new Date().toLocaleDateString('fr-FR')}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
}
