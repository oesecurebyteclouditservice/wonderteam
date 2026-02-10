import React, { useEffect, useState, useRef } from 'react';
import { DataService } from '../services/dataService';
import { Product } from '../types';
import { Search, Plus, AlertTriangle, Package, TrendingDown, TrendingUp, UploadCloud, X, Upload, Edit2, Trash2 } from 'lucide-react';

const Stock: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const addImageRef = useRef<HTMLInputElement>(null);

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editProductImage, setEditProductImage] = useState<File | null>(null);
  const editImageRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    try {
      const newQuantity = Math.max(0, product.stock_quantity + change);
      await DataService.updateStock(product.id, newQuantity);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newQuantity } : p));
    } catch (e) {
      console.error('Stock: Failed to update stock', e);
    }
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
                      name: cols[1]?.trim() || 'Produit Importe',
                      brand: cols[2]?.trim() || 'Marque',
                      category: 'Import',
                      price_public: parseFloat(cols[3]) || 0,
                      price_cost: (parseFloat(cols[3]) || 0) / 2,
                      stock_quantity: parseInt(cols[4]) || 0,
                      alert_threshold: 2,
                      image_url: 'https://via.placeholder.com/150'
                  };
                  await DataService.addProduct(newProd as any);
                  count++;
              }
          }
          alert(`${count} produits importes avec succes !`);
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
          description: (form.elements.namedItem('description') as HTMLInputElement).value || '',
          price_public: parseFloat((form.elements.namedItem('price') as HTMLInputElement).value),
          price_cost: parseFloat((form.elements.namedItem('cost') as HTMLInputElement).value),
          stock_quantity: parseInt((form.elements.namedItem('stock') as HTMLInputElement).value),
          alert_threshold: parseInt((form.elements.namedItem('alert_threshold') as HTMLInputElement).value) || 2,
          sku: (form.elements.namedItem('sku') as HTMLInputElement).value || '',
          barcode: (form.elements.namedItem('barcode') as HTMLInputElement).value || '',
          image_url: imageUrl
      };

      try {
          const newProd = await DataService.addProduct(productData as any);

          // Handle Image Upload if present
          if (newProductImage) {
              const newImageUrl = await DataService.updateProductImage(newProd.id, newProductImage);
              newProd.image_url = newImageUrl;
          }

          // Update local state immediately
          setProducts(prev => [...prev, newProd]);
          setIsAddModalOpen(false);
          setNewProductImage(null);
          // Also refresh from server in background
          loadProducts();
      } catch (err) {
          alert("Erreur lors de l'ajout");
      }
  };

  const openEditModal = (product: Product) => {
      setEditProduct({ ...product });
      setEditProductImage(null);
      setIsEditModalOpen(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editProduct) return;

      try {
          await DataService.updateProduct(editProduct);

          // Handle new image upload if changed
          if (editProductImage) {
              const newImageUrl = await DataService.updateProductImage(editProduct.id, editProductImage);
              editProduct.image_url = newImageUrl;
          }

          // Update local state immediately so UI reflects changes even if re-fetch returns stale data
          setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...editProduct } : p));
          setIsEditModalOpen(false);
          setEditProduct(null);
          setEditProductImage(null);
          // Also refresh from server in background
          loadProducts();
      } catch (err) {
          alert("Erreur lors de la modification");
      }
  };

  const handleDeleteProduct = async (productId: string) => {
      try {
          await DataService.deleteProduct(productId);
          // Update local state immediately
          setProducts(prev => prev.filter(p => p.id !== productId));
          setDeleteConfirmId(null);
          // Also refresh from server in background
          loadProducts();
      } catch (err) {
          alert("Erreur lors de la suppression");
      }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.reference || '').includes(search) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.stock_quantity <= p.alert_threshold).length;

  const inputClass = "w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800";

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
                <p className="text-xs text-slate-500 font-bold uppercase">Total References</p>
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
            placeholder="Rechercher par nom, ref ou SKU..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
              <div className="col-span-5">Produit</div>
              <div className="col-span-2 text-center">Prix</div>
              <div className="col-span-3 text-center">Stock</div>
              <div className="col-span-2 text-center">Actions</div>
          </div>
          <div className="divide-y divide-slate-100">
              {filtered.map(product => (
                  <div key={product.id} className="p-4 flex flex-col md:grid md:grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
                      {/* Product Info */}
                      <div className="w-full md:col-span-5 flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                              <img src={product.image_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <p className="text-xs text-slate-400 font-mono">
                                  {product.sku ? `SKU: ${product.sku}` : product.reference ? `Ref: ${product.reference}` : ''}
                              </p>
                              <p className="font-bold text-slate-800">{product.name}</p>
                              <p className="text-xs text-rose-600 font-bold uppercase">{product.brand}</p>
                          </div>
                      </div>

                      {/* Price */}
                      <div className="w-full md:col-span-2 flex justify-between md:justify-center items-center">
                          <span className="md:hidden text-slate-400 text-sm">Prix:</span>
                          <div className="text-center">
                              <span className="font-bold text-slate-800 block">{product.price_public.toFixed(2)}€</span>
                              <span className="text-xs text-slate-400">Coût: {product.price_cost.toFixed(2)}€</span>
                          </div>
                      </div>

                      {/* Stock Controls */}
                      <div className="w-full md:col-span-3 flex justify-between md:justify-center items-center gap-4">
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

                      {/* Action Buttons */}
                      <div className="w-full md:col-span-2 flex justify-end md:justify-center items-center gap-2">
                          <button
                              onClick={() => openEditModal(product)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Modifier"
                          >
                              <Edit2 size={16} />
                          </button>
                          <button
                              onClick={() => setDeleteConfirmId(product.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Supprimer"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                   <button onClick={() => { setIsAddModalOpen(false); setNewProductImage(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
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
                                   <input name="reference" placeholder="Reference (ex: 069)" required className={inputClass} />
                                   <input name="stock" type="number" placeholder="Stock Initial" required className={inputClass} />
                               </div>
                               <input name="name" placeholder="Nom du produit" required className={inputClass} />
                               <div className="grid grid-cols-2 gap-4">
                                   <input name="brand" placeholder="Marque" className={inputClass} />
                                   <select name="category" className={inputClass}>
                                       <option value="">Categorie</option>
                                       <option value="FEMME">FEMME</option>
                                       <option value="HOMME">HOMME</option>
                                       <option value="MIXTE">MIXTE</option>
                                       <option value="SOINS">SOINS</option>
                                       <option value="LUXURY FEMME">LUXURY FEMME</option>
                                       <option value="LUXURY MIXTES">LUXURY MIXTES</option>
                                   </select>
                               </div>
                               <textarea name="description" placeholder="Description du produit" rows={2} className={inputClass} />
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="relative">
                                       <span className="absolute left-3 top-3 text-slate-400">€</span>
                                       <input name="price" type="number" step="0.01" placeholder="Prix Vente" required className={`${inputClass} pl-8`} />
                                   </div>
                                   <div className="relative">
                                       <span className="absolute left-3 top-3 text-slate-400">€</span>
                                       <input name="cost" type="number" step="0.01" placeholder="Cout Achat" required className={`${inputClass} pl-8`} />
                                   </div>
                               </div>
                               <div className="grid grid-cols-3 gap-4">
                                   <input name="alert_threshold" type="number" placeholder="Seuil alerte" defaultValue={2} className={inputClass} />
                                   <input name="sku" placeholder="SKU" className={inputClass} />
                                   <input name="barcode" placeholder="Code-barres" className={inputClass} />
                               </div>
                           </div>
                       </div>

                       <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                           <button type="button" onClick={() => { setIsAddModalOpen(false); setNewProductImage(null); }} className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-50">Annuler</button>
                           <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 transition">Ajouter au catalogue</button>
                       </div>
                   </form>
              </div>
          </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-2xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                   <button onClick={() => { setIsEditModalOpen(false); setEditProduct(null); setEditProductImage(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                       <X size={24} />
                   </button>
                   <h2 className="text-xl font-bold mb-6 text-slate-900">Modifier le Produit</h2>
                   <form onSubmit={handleEditProduct} className="space-y-4">
                       <div className="flex gap-6">
                           {/* Image Upload */}
                           <div className="w-1/3">
                               <div
                                    onClick={() => editImageRef.current?.click()}
                                    className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 transition overflow-hidden"
                                >
                                    {editProductImage ? (
                                        <img src={URL.createObjectURL(editProductImage)} className="w-full h-full object-cover rounded-lg" />
                                    ) : editProduct.image_url ? (
                                        <img src={editProduct.image_url} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <>
                                            <Upload className="text-slate-400 mb-2" />
                                            <span className="text-xs text-slate-400">Changer photo</span>
                                        </>
                                    )}
                               </div>
                               <input type="file" ref={editImageRef} className="hidden" accept="image/*" onChange={e => e.target.files && setEditProductImage(e.target.files[0])} />
                           </div>

                           {/* Fields */}
                           <div className="w-2/3 space-y-4">
                               <div className="grid grid-cols-2 gap-4">
                                   <input
                                       placeholder="Reference"
                                       value={editProduct.reference || ''}
                                       onChange={e => setEditProduct({...editProduct, reference: e.target.value})}
                                       className={inputClass}
                                   />
                                   <input
                                       type="number"
                                       placeholder="Stock"
                                       value={editProduct.stock_quantity}
                                       onChange={e => setEditProduct({...editProduct, stock_quantity: parseInt(e.target.value) || 0})}
                                       className={inputClass}
                                   />
                               </div>
                               <input
                                   placeholder="Nom du produit"
                                   value={editProduct.name}
                                   onChange={e => setEditProduct({...editProduct, name: e.target.value})}
                                   required
                                   className={inputClass}
                               />
                               <div className="grid grid-cols-2 gap-4">
                                   <input
                                       placeholder="Marque"
                                       value={editProduct.brand}
                                       onChange={e => setEditProduct({...editProduct, brand: e.target.value})}
                                       className={inputClass}
                                   />
                                   <select
                                       value={editProduct.category}
                                       onChange={e => setEditProduct({...editProduct, category: e.target.value})}
                                       className={inputClass}
                                   >
                                       <option value="">Categorie</option>
                                       <option value="FEMME">FEMME</option>
                                       <option value="HOMME">HOMME</option>
                                       <option value="MIXTE">MIXTE</option>
                                       <option value="SOINS">SOINS</option>
                                       <option value="LUXURY FEMME">LUXURY FEMME</option>
                                       <option value="LUXURY MIXTES">LUXURY MIXTES</option>
                                       <option value="MIXTES LUXES">MIXTES LUXES</option>
                                   </select>
                               </div>
                               <textarea
                                   placeholder="Description du produit"
                                   rows={2}
                                   value={editProduct.description || ''}
                                   onChange={e => setEditProduct({...editProduct, description: e.target.value})}
                                   className={inputClass}
                               />
                               <div className="grid grid-cols-2 gap-4">
                                   <div className="relative">
                                       <span className="absolute left-3 top-3 text-slate-400">€</span>
                                       <input
                                           type="number" step="0.01"
                                           placeholder="Prix Vente"
                                           value={editProduct.price_public}
                                           onChange={e => setEditProduct({...editProduct, price_public: parseFloat(e.target.value) || 0})}
                                           required
                                           className={`${inputClass} pl-8`}
                                       />
                                   </div>
                                   <div className="relative">
                                       <span className="absolute left-3 top-3 text-slate-400">€</span>
                                       <input
                                           type="number" step="0.01"
                                           placeholder="Cout Achat"
                                           value={editProduct.price_cost}
                                           onChange={e => setEditProduct({...editProduct, price_cost: parseFloat(e.target.value) || 0})}
                                           required
                                           className={`${inputClass} pl-8`}
                                       />
                                   </div>
                               </div>
                               <div className="grid grid-cols-3 gap-4">
                                   <input
                                       type="number"
                                       placeholder="Seuil alerte"
                                       value={editProduct.alert_threshold}
                                       onChange={e => setEditProduct({...editProduct, alert_threshold: parseInt(e.target.value) || 0})}
                                       className={inputClass}
                                   />
                                   <input
                                       placeholder="SKU"
                                       value={editProduct.sku || ''}
                                       onChange={e => setEditProduct({...editProduct, sku: e.target.value})}
                                       className={inputClass}
                                   />
                                   <input
                                       placeholder="Code-barres"
                                       value={editProduct.barcode || ''}
                                       onChange={e => setEditProduct({...editProduct, barcode: e.target.value})}
                                       className={inputClass}
                                   />
                               </div>
                           </div>
                       </div>

                       <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                           <button type="button" onClick={() => { setIsEditModalOpen(false); setEditProduct(null); setEditProductImage(null); }} className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-50">Annuler</button>
                           <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 transition">Enregistrer</button>
                       </div>
                   </form>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trash2 className="text-red-600" size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Supprimer ce produit ?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      Cette action est irreversible. Le produit sera definitivement supprime du catalogue.
                  </p>
                  <div className="flex gap-3">
                      <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="flex-1 px-4 py-2 rounded-lg text-slate-600 border border-slate-200 hover:bg-slate-50"
                      >
                          Annuler
                      </button>
                      <button
                          onClick={() => handleDeleteProduct(deleteConfirmId)}
                          className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition"
                      >
                          Supprimer
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Stock;
