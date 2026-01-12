import React, { useEffect, useState, useContext, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Product } from '../types';
import { CartContext } from '../App';
import { Plus, Search, Upload, Check, AlertCircle } from 'lucide-react';

const Catalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { addToCart } = useContext(CartContext);
  const [addedId, setAddedId] = useState<string | null>(null);
  
  // Ref for file input triggers
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await DataService.getProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleAddToCart = (product: Product) => {
      addToCart(product);
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 1500); // Reset feedback
  };

  const handleImageUpload = async (productId: string, file: File) => {
      try {
          await DataService.updateProductImage(productId, file);
          // Reload local state to show new image (in mock)
          loadProducts(); 
          alert("Image mise à jour !");
      } catch (e) {
          alert("Erreur lors de l'upload");
      }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.reference.includes(search)
  );

  return (
    <div className="p-4 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold text-slate-900">Catalogue</h2>
        <div className="bg-rose-100 p-2 rounded-full">
            <span className="text-rose-700 font-bold text-xs">{products.length} Refs</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
            type="text" 
            placeholder="Rechercher par nom ou référence..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-rose-500 focus:outline-none text-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 pb-20">
        {loading ? (
            [1,2,3,4].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-xl"></div>)
        ) : (
            filteredProducts.map(product => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="relative h-40 bg-slate-100 group">
                        <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                        />
                        {/* Upload Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button 
                                onClick={() => fileInputRefs.current[product.id]?.click()}
                                className="bg-white/90 p-2 rounded-full text-slate-800 hover:scale-110 transition"
                             >
                                <Upload size={16} />
                             </button>
                             <input 
                                type="file" 
                                className="hidden" 
                                ref={el => { fileInputRefs.current[product.id] = el; }}
                                onChange={(e) => e.target.files && handleImageUpload(product.id, e.target.files[0])}
                             />
                        </div>
                        {/* Stock Badge */}
                        <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            product.stock_quantity <= product.alert_threshold ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-800'
                        }`}>
                            Stack: {product.stock_quantity}
                        </div>
                    </div>
                    
                    <div className="p-3 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] text-slate-400 font-mono">#{product.reference}</span>
                            <span className="text-[10px] text-amber-500 font-bold tracking-wider">{product.brand}</span>
                        </div>
                        <h3 className="font-semibold text-slate-800 leading-tight mb-2 line-clamp-2 text-sm">{product.name}</h3>
                        
                        <div className="mt-auto flex items-center justify-between">
                            <span className="font-bold text-rose-600">{product.price_public}€</span>
                            <button 
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock_quantity === 0}
                                className={`p-2 rounded-lg transition-colors ${
                                    addedId === product.id 
                                    ? 'bg-green-500 text-white' 
                                    : product.stock_quantity === 0 
                                        ? 'bg-slate-100 text-slate-300' 
                                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                }`}
                            >
                                {addedId === product.id ? <Check size={18} /> : <Plus size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Catalog;