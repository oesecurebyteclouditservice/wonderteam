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

  const handleStockUpdate = async (product: Product, change: number, size?: '15ml' | '30ml' | '70ml') => {
    try {
      let newQuantity: number;
      if (size === '15ml') {
        newQuantity = Math.max(0, product.stock_15ml + change);
      } else if (size === '30ml') {
        newQuantity = Math.max(0, product.stock_30ml + change);
      } else if (size === '70ml') {
        newQuantity = Math.max(0, product.stock_70ml + change);
      } else {
        newQuantity = Math.max(0, product.stock_total + change);
      }

      await DataService.updateStock(product.id, newQuantity, size);

      // Update local state
      setProducts(prev => prev.map(p => {
        if (p.id === product.id) {
          const updated = { ...p };
          if (size === '15ml') {
            updated.stock_15ml = newQuantity;
          } else if (size === '30ml') {
            updated.stock_30ml = newQuantity;
          } else if (size === '70ml') {
            updated.stock_70ml = newQuantity;
          }
          // Recalculate total
          updated.stock_total = updated.stock_15ml + updated.stock_30ml + updated.stock_70ml;
          return updated;
        }
        return p;
      }));
    } catch (e) {
      console.error('Stock: Failed to update stock', e);
    }
  };

  const parsePrice = (priceText: string): number => {
    if (!priceText) return 0;
    const cleaned = priceText.replace(/[€\s]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const text = event.target?.result as string;
          // CSV Format: NOM;CATEGORIE;CAT_15ML;CAT_30ML;CAT_70ML;MARQUE;PX_15ML;PX_30ML;PX_70ML;STOCK TOTAL;STOCK_15ML;STOCK_30ML;STOCK_70ML
          const lines = text.split('\n').slice(1); // Skip header
          let count = 0;
          for (const line of lines) {
              if (!line.trim()) continue;
              const cols = line.split(';');
              if (cols.length >= 13) {
                  const newProd = {
                      name: cols[0]?.trim() || 'Produit Importe',
                      category: cols[1]?.trim() || 'Import',
                      cat_15ml: cols[2]?.trim() || '',
                      cat_30ml: cols[3]?.trim() || '',
                      cat_70ml: cols[4]?.trim() || '',
                      brand: cols[5]?.trim() || 'Marque',
                      price_15ml: parsePrice(cols[6]),
                      price_30ml: parsePrice(cols[7]),
                      price_70ml: parsePrice(cols[8]),
                      stock_total: parseInt(cols[9]) || 0,
                      stock_15ml: parseInt(cols[10]) || 0,
                      stock_30ml: parseInt(cols[11]) || 0,
                      stock_70ml: parseInt(cols[12]) || 0,
                      alert_threshold: 2,
                      image_url: 'https://via.placeholder.com/150'
                  };
                  try {
                      await DataService.addProduct(newProd as any);
                      count++;
                  } catch (err) {
                      console.error('Failed to import product:', newProd.name, err);
                  }
              }
          }
          alert(`${count} produits importes avec succes !`);
          loadProducts();
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleAddProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;

      let imageUrl = 'https://via.placeholder.com/150';

      const productData = {
          name: (form.elements.namedItem('name') as HTMLInputElement).value,
          brand: (form.elements.namedItem('brand') as HTMLInputElement).value,
          category: (form.elements.namedItem('category') as HTMLInputElement).value,
          description: (form.elements.namedItem('description') as HTMLInputElement).value || '',
          cat_15ml: (form.elements.namedItem('cat_15ml') as HTMLInputElement).value || '',
          cat_30ml: (form.elements.namedItem('cat_30ml') as HTMLInputElement).value || '',
          cat_70ml: (form.elements.namedItem('cat_70ml') as HTMLInputElement).value || '',
          price_15ml: parseFloat((form.elements.namedItem('price_15ml') as HTMLInputElement).value) || 0,
          price_30ml: parseFloat((form.elements.namedItem('price_30ml') as HTMLInputElement).value) || 0,
          price_70ml: parseFloat((form.elements.namedItem('price_70ml') as HTMLInputElement).value) || 0,
          stock_15ml: parseInt((form.elements.namedItem('stock_15ml') as HTMLInputElement).value) || 0,
          stock_30ml: parseInt((form.elements.namedItem('stock_30ml') as HTMLInputElement).value) || 0,
          stock_70ml: parseInt((form.elements.namedItem('stock_70ml') as HTMLInputElement).value) || 0,
          stock_total: 0,
          alert_threshold: parseInt((form.elements.namedItem('alert_threshold') as HTMLInputElement).value) || 2,
          image_url: imageUrl
      };

      // Calculate total stock
      productData.stock_total = productData.stock_15ml + productData.stock_30ml + productData.stock_70ml;

      try {
          const newProd = await DataService.addProduct(productData as any);

          // Handle Image Upload if present
          if (newProductImage) {
              const newImageUrl = await DataService.updateProductImage(newProd.id, newProductImage);
              newProd.image_url = newImageUrl;
          }

          setProducts(prev => [...prev, newProd]);
          setIsAddModalOpen(false);
          setNewProductImage(null);
          loadProducts();
      } catch (err) {
          console.error('Add product error:', err);
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
          // Recalculate total stock
          editProduct.stock_total = editProduct.stock_15ml + editProduct.stock_30ml + editProduct.stock_70ml;

          await DataService.updateProduct(editProduct);

          if (editProductImage) {
              const newImageUrl = await DataService.updateProductImage(editProduct.id, editProductImage);
              editProduct.image_url = newImageUrl;
          }

          setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...editProduct } : p));
          setIsEditModalOpen(false);
          setEditProduct(null);
          setEditProductImage(null);
      } catch (err) {
          console.error('Edit product error:', err);
          alert("Erreur lors de la modification");
      }
  };

  const handleDeleteProduct = async (productId: string) => {
      try {
          await DataService.deleteProduct(productId);
          setProducts(prev => prev.filter(p => p.id !== productId));
          setDeleteConfirmId(null);
      } catch (err) {
          console.error('Delete product error:', err);
          alert("Erreur lors de la suppression");
      }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.cat_15ml || '').includes(search) ||
    (p.cat_30ml || '').includes(search) ||
    (p.cat_70ml || '').includes(search)
  );

  const lowStockCount = products.filter(p => p.stock_total <= p.alert_threshold).length;

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
            placeholder="Rechercher par nom ou reference..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                      <tr>
                          <th className="p-4 text-left">Produit</th>
                          <th className="p-4 text-center">15ml</th>
                          <th className="p-4 text-center">30ml</th>
                          <th className="p-4 text-center">70ml</th>
                          <th className="p-4 text-center">Total</th>
                          <th className="p-4 text-center">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filtered.map(product => (
                          <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                              {/* Product Info */}
                              <td className="p-4">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0 overflow-hidden">
                                          <img src={product.image_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" alt={product.name} />
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-800">{product.name}</p>
                                          <p className="text-xs text-rose-600 font-bold uppercase">{product.brand}</p>
                                          <p className="text-xs text-slate-400">{product.category}</p>
                                      </div>
                                  </div>
                              </td>

                              {/* 15ml Stock */}
                              <td className="p-4">
                                  <div className="flex flex-col items-center gap-2">
                                      {product.price_15ml > 0 && (
                                          <>
                                              <span className="text-xs text-slate-500">{product.price_15ml.toFixed(2)}€</span>
                                              <div className="flex items-center gap-2">
                                                  <button
                                                      onClick={() => handleStockUpdate(product, -1, '15ml')}
                                                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                                  >
                                                      <TrendingDown size={14} />
                                                  </button>
                                                  <div className="w-10 text-center py-1 rounded bg-slate-100 text-slate-800 font-bold text-sm">
                                                      {product.stock_15ml}
                                                  </div>
                                                  <button
                                                      onClick={() => handleStockUpdate(product, 1, '15ml')}
                                                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                                  >
                                                      <TrendingUp size={14} />
                                                  </button>
                                              </div>
                                          </>
                                      )}
                                      {product.price_15ml === 0 && <span className="text-xs text-slate-300">-</span>}
                                  </div>
                              </td>

                              {/* 30ml Stock */}
                              <td className="p-4">
                                  <div className="flex flex-col items-center gap-2">
                                      {product.price_30ml > 0 && (
                                          <>
                                              <span className="text-xs text-slate-500">{product.price_30ml.toFixed(2)}€</span>
                                              <div className="flex items-center gap-2">
                                                  <button
                                                      onClick={() => handleStockUpdate(product, -1, '30ml')}
                                                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                                  >
                                                      <TrendingDown size={14} />
                                                  </button>
                                                  <div className="w-10 text-center py-1 rounded bg-slate-100 text-slate-800 font-bold text-sm">
                                                      {product.stock_30ml}
                                                  </div>
                                                  <button
                                                      onClick={() => handleStockUpdate(product, 1, '30ml')}
                                                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                                  >
                                                      <TrendingUp size={14} />
                                                  </button>
                                              </div>
                                          </>
                                      )}
                                      {product.price_30ml === 0 && <span className="text-xs text-slate-300">-</span>}
                                  </div>
                              </td>

                              {/* 70ml Stock */}
                              <td className="p-4">
                                  <div className="flex flex-col items-center gap-2">
                                      {product.price_70ml > 0 && (
                                          <>
                                              <span className="text-xs text-slate-500">{product.price_70ml.toFixed(2)}€</span>
                                              <div className="flex items-center gap-2">
                                                  <button
                                                      onClick={() => handleStockUpdate(product, -1, '70ml')}
                                                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                                  >
                                                      <TrendingDown size={14} />
                                                  </button>
                                                  <div className="w-10 text-center py-1 rounded bg-slate-100 text-slate-800 font-bold text-sm">
                                                      {product.stock_70ml}
                                                  </div>
                                                  <button
                                                      onClick={() => handleStockUpdate(product, 1, '70ml')}
                                                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                                                  >
                                                      <TrendingUp size={14} />
                                                  </button>
                                              </div>
                                          </>
                                      )}
                                      {product.price_70ml === 0 && <span className="text-xs text-slate-300">-</span>}
                                  </div>
                              </td>

                              {/* Total Stock */}
                              <td className="p-4 text-center">
                                  <div className={`inline-block px-3 py-1 rounded-full font-bold ${
                                      product.stock_total <= product.alert_threshold ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                  }`}>
                                      {product.stock_total}
                                  </div>
                              </td>

                              {/* Actions */}
                              <td className="p-4">
                                  <div className="flex justify-center items-center gap-2">
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
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Product Modal - SIMPLIFIED VERSION - Full version in next file */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-3xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                   <button onClick={() => { setIsAddModalOpen(false); setNewProductImage(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                       <X size={24} />
                   </button>
                   <h2 className="text-xl font-bold mb-6 text-slate-900">Nouveau Produit</h2>
                   <form onSubmit={handleAddProduct} className="space-y-4">
                       <input name="name" placeholder="Nom du produit" required className={inputClass} />
                       <div className="grid grid-cols-2 gap-4">
                           <input name="brand" placeholder="Marque" className={inputClass} />
                           <select name="category" className={inputClass}>
                               <option value="">Categorie</option>
                               <option value="FEMME">FEMME</option>
                               <option value="HOMME">HOMME</option>
                               <option value="MIXTE">MIXTE</option>
                               <option value="LUXURY FEMME">LUXURY FEMME</option>
                               <option value="LUXURY MIXTES">LUXURY MIXTES</option>
                           </select>
                       </div>

                       <h3 className="font-bold text-slate-700 mt-4">Prix et Stock par Taille</h3>
                       <div className="grid grid-cols-3 gap-4">
                           <div>
                               <label className="text-xs text-slate-500">15ml</label>
                               <input name="price_15ml" type="number" step="0.01" placeholder="Prix" className={inputClass} />
                               <input name="stock_15ml" type="number" placeholder="Stock" className={inputClass + " mt-2"} />
                           </div>
                           <div>
                               <label className="text-xs text-slate-500">30ml</label>
                               <input name="price_30ml" type="number" step="0.01" placeholder="Prix" className={inputClass} />
                               <input name="stock_30ml" type="number" placeholder="Stock" className={inputClass + " mt-2"} />
                           </div>
                           <div>
                               <label className="text-xs text-slate-500">70ml</label>
                               <input name="price_70ml" type="number" step="0.01" placeholder="Prix" className={inputClass} />
                               <input name="stock_70ml" type="number" placeholder="Stock" className={inputClass + " mt-2"} />
                           </div>
                       </div>

                       <div className="grid grid-cols-3 gap-4">
                           <input name="cat_15ml" placeholder="Ref 15ml" className={inputClass} />
                           <input name="cat_30ml" placeholder="Ref 30ml" className={inputClass} />
                           <input name="cat_70ml" placeholder="Ref 70ml" className={inputClass} />
                       </div>

                       <input name="alert_threshold" type="number" placeholder="Seuil alerte" defaultValue={2} className={inputClass} />
                       <textarea name="description" placeholder="Description" className={inputClass} />

                       <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                           <button type="button" onClick={() => { setIsAddModalOpen(false); setNewProductImage(null); }} className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-50">Annuler</button>
                           <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-rose-700 transition">Ajouter</button>
                       </div>
                   </form>
              </div>
          </div>
      )}

      {/* Edit Modal - Similar structure to Add Modal */}
      {isEditModalOpen && editProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white w-full max-w-3xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                   <button onClick={() => { setIsEditModalOpen(false); setEditProduct(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                       <X size={24} />
                   </button>
                   <h2 className="text-xl font-bold mb-6 text-slate-900">Modifier le Produit</h2>
                   <form onSubmit={handleEditProduct} className="space-y-4">
                       <input
                           placeholder="Nom"
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
                               <option value="LUXURY FEMME">LUXURY FEMME</option>
                               <option value="LUXURY MIXTES">LUXURY MIXTES</option>
                           </select>
                       </div>

                       <h3 className="font-bold text-slate-700 mt-4">Prix et Stock par Taille</h3>
                       <div className="grid grid-cols-3 gap-4">
                           <div>
                               <label className="text-xs text-slate-500">15ml</label>
                               <input
                                   type="number" step="0.01"
                                   placeholder="Prix"
                                   value={editProduct.price_15ml}
                                   onChange={e => setEditProduct({...editProduct, price_15ml: parseFloat(e.target.value) || 0})}
                                   className={inputClass}
                               />
                               <input
                                   type="number"
                                   placeholder="Stock"
                                   value={editProduct.stock_15ml}
                                   onChange={e => setEditProduct({...editProduct, stock_15ml: parseInt(e.target.value) || 0})}
                                   className={inputClass + " mt-2"}
                               />
                           </div>
                           <div>
                               <label className="text-xs text-slate-500">30ml</label>
                               <input
                                   type="number" step="0.01"
                                   placeholder="Prix"
                                   value={editProduct.price_30ml}
                                   onChange={e => setEditProduct({...editProduct, price_30ml: parseFloat(e.target.value) || 0})}
                                   className={inputClass}
                               />
                               <input
                                   type="number"
                                   placeholder="Stock"
                                   value={editProduct.stock_30ml}
                                   onChange={e => setEditProduct({...editProduct, stock_30ml: parseInt(e.target.value) || 0})}
                                   className={inputClass + " mt-2"}
                               />
                           </div>
                           <div>
                               <label className="text-xs text-slate-500">70ml</label>
                               <input
                                   type="number" step="0.01"
                                   placeholder="Prix"
                                   value={editProduct.price_70ml}
                                   onChange={e => setEditProduct({...editProduct, price_70ml: parseFloat(e.target.value) || 0})}
                                   className={inputClass}
                               />
                               <input
                                   type="number"
                                   placeholder="Stock"
                                   value={editProduct.stock_70ml}
                                   onChange={e => setEditProduct({...editProduct, stock_70ml: parseInt(e.target.value) || 0})}
                                   className={inputClass + " mt-2"}
                               />
                           </div>
                       </div>

                       <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                           <button type="button" onClick={() => { setIsEditModalOpen(false); setEditProduct(null); }} className="px-6 py-2 rounded-lg text-slate-600 hover:bg-slate-50">Annuler</button>
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
                      Cette action est irreversible.
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
