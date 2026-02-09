import React, { useEffect, useState, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Product } from '../types';
import { Search, Plus, AlertTriangle, Package, TrendingDown, TrendingUp, UploadCloud, X, Upload } from 'lucide-react';

const Stock: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const addImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await DataService.getProducts();
      setProducts(data);
    } catch (e) {
      console.error('Stock: Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (product: Product, change: number) => {
    const newQuantity = Math.max(0, product.stock_quantity + change);
    await DataService.updateStock(product.id, newQuantity);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newQuantity } : p));
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          // Simple parsing logic: Reference, Name, Brand, Price, Stock
          const lines = text.split('\n').slice(1); // Skip header
          let count = 0;
          for (const line of lines) {
              const cols = line.split(',');
              if (cols.length >= 5) {
                  const newProd = {
                      reference: cols[0]?.trim() || 'N/A',
                      name: cols[1]?.trim() || 'Produit Importé',
                      brand: cols[2]?.trim() || 'Marque',
                      category: 'Import',
                      price_public: parseFloat(cols[3]) || 0,
                      price_cost: (parseFloat(cols[3]) || 0) / 2,
                      stock_quantity: parseInt(cols[4]) || 0,
                      alert_threshold: 2,
                      image_url: 'https://via.placeholder.com/150'
                  };
                  await DataService.addProduct(newProd);
                  count++;
              }
          }
          alert(`${count} produits importés avec succès !`);
          loadProducts();
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  const handleAddProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      
      let imageUrl = 'https://via.placeholder.com/150';

      const productData = {
          reference: (form.elements.namedItem('reference') as HTMLInputElement).value,
          name: (form.elements.namedItem('name') as HTMLInputElement).value,
          brand: (form.elements.namedItem('brand') as HTMLInputElement).value,
          category: (form.elements.namedItem('category') as HTMLInputElement).value,
          price_public: parseFloat((form.elements.namedItem('price') as HTMLInputElement).value),
          price_cost: parseFloat((form.elements.namedItem('cost') as HTMLInputElement).value),
          stock_quantity: parseInt((form.elements.namedItem('stock') as HTMLInputElement).value),
          alert_threshold: 2,
          image_url: imageUrl
      };

      try {
          const newProd = await DataService.addProduct(productData);
          
          // Handle Image Upload if present
          if (newProductImage) {
              await DataService.updateProductImage(newProd.id, newProductImage);
          }
          
          setIsAddModalOpen(false);
          setNewProductImage(null);
          loadProducts();
      } catch (err) {
          alert("Erreur lors de l'ajout");
      }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.reference.includes(search)
  );

  const lowStockCount = products.filter(p => p.stock_quantity <= p.alert_threshold).length;

  return (
    <div className="p-4 pt-8 pb-20">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-serif font-bold text-slate-900">Gestion des Stocks</h2>
        <div className="flex gap-2">
            <button 
                onClick={() => csvInputRef.current?.click()}
                className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition"
            >
                <UploadCloud size={18} />
                <span className="hidden sm:inline">Importer CSV</span>
            </button>
            <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={csvInputRef} 
                onChange={handleCSVImport}
            />
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-rose-200 hover:bg-rose-700 transition"
            >
                <Plus size={18} />
                <span className="hidden sm:inline">Ajouter un produit</span>
            </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Package size={20} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Total Références</p>
                <p className="text-xl font-bold text-slate-800">{products.length}</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className={`p-3 rounded-lg ${lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <AlertTriangle size={20} />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Stock Critique</p>
                <p className={`text-xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{lowStockCount}</p>
            </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
        <input 
            type="text" 
            placeholder="Rechercher..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
              <div className="col-span-6">Produit</div>
              <div className="col-span-2 text-center">Prix</div>
              <div className="col-span-4 text-center">Stock</div>
          </div>
          <div className="divide-y divide-slate-100">
              {filtered.map(product => (
                  <div key={product.id} className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
                      {/* Product Info */}
                      <div className="w-full md:col-span-6 flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                              <img src={product.image_url} className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <p className="text-xs text-slate-400 font-mono">Ref: {product.reference}</p>
                              <p className="font-bold text-slate-800">{product.name}</p>
                              <p className="text-xs text-rose-600 font-bold uppercase">{product.brand}</p>
                          </div>
                      </div>

                      {/* Price */}
                      <div className="w-full md:col-span-2 flex justify-between md:justify-center items-center">
                          <span className="md:hidden text-slate-400 text-sm">Prix:</span>
                          <span className="font-medium text-slate-700">{product.price_public}€</span>
                      </div>

                      {/* Stock Controls */}
                      <div className="w-full md:col-span-4 flex justify-between md:justify-center items-center gap-4">
                           <span className="md:hidden text-slate-400 text-sm">Stock:</span>
                           <div className="flex items-center gap-3">
                               <button 
                                    onClick={() => handleStockUpdate(product, -1)}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                               >
                                   <TrendingDown size={16} />
                               </button>
                               <div className={`w-12 text-center py-1 rounded font-bold ${
                                   product.stock_quantity <= product.alert_threshold ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-800'
                               }`}>
                                   {product.stock_quantity}
                               </div>
                               <button 
                                    onClick={() => handleStockUpdate(product, 1)}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                               >
                                   <TrendingUp size={16} />
                               </button>
                           </div>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                   <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                       <X size={24} />
                   </button>
                   <h2 className="text-xl font-bold mb-6 text-slate-900">Nouveau Produit</h2>
                   <form onSubmit={handleAddProduct} className="space-y-4">
                       <div className="flex gap-6">
                           {/* Image Upload */}
                           <div className="w-1/3">
                               <div 
                                    onClick={() => addImageRef.current?.click()}
                                    className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 transition"
                                >
                                    {newProductImage ? (
                                        <img src={URL.createObjectURL(newProductImage)} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <>
                                            <Upload className="text-slate-400 mb-2" />
                                            <span className="text-xs text-slate-400">Ajouter photo</span>
                                        </>
                                    )}
                               </div>
                               <input type="file" ref={addImageRef} className="hidden" accept="image/*" onChange={e => e.target.files && setNewProductImage(e.target.files[0])} />
                           </div>
                           
                           {/* Fields */}
                           <div className="w-2/3 space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                   <input name="reference" placeholder="Référence (ex: 069)" required className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800" />
                                   <input name="stock" type="number" placeholder="Stock Initial" required className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800" />
                               </div>
                               <input name="name" placeholder="Nom du produit" required className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800" />
                               <div className="grid grid-cols-2 gap-4">
                                   <input name="brand" placeholder="Marque" className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800" />
                                   <select name="category" className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800">
                                       <option value="">Sélectionner une catégorie</option>
                                       <option value="FEMME">FEMME</option>
                                       <option value="HOMME">HOMME</option>
                                       <option value="MIXTE">MIXTE</option>
                                       <option value="SOINS">SOINS</option>
                                   </select>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="relative">
                                       <span className="absolute left-3 top-3 text-slate-400">€</span>
                                       <input name="price" type="number" step="0.01" placeholder="Prix Vente" required className="w-full pl-8 p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800" />
                                   </div>
                                   <div className="relative">
                                       <span className="absolute left-3 top-3 text-slate-400">€</span>
                                       <input name="cost" type="number" step="0.01" placeholder="Coût Achat" required className="w-full pl-8 p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800" />
                                   </div>
                               </div>
                           </div>
                       </div>
                       
                       <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                           <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-50">Annuler</button>
                           <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 transition">Ajouter au catalogue</button>
                       </div>
                   </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Stock;