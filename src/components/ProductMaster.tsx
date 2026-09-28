import React, { useState } from 'react';
import { Product, Company, Shop, db, exportToCsvWithBom } from '../db/db';
import { 
  Package, 
  Plus, 
  Download, 
  AlertTriangle, 
  Search, 
  Filter, 
  Check, 
  Building2,
  DollarSign,
  Pencil,
  Trash2,
  X
} from 'lucide-react';

interface ProductMasterProps {
  products: Product[];
  companies: Company[];
  shops: Shop[];
  activeShop: Shop;
  stocksMap: Record<number, number>;
  languageMode: 'EN' | 'BN' | 'BOTH';
  onRefresh: () => void;
}

export const ProductMaster: React.FC<ProductMasterProps> = ({
  products,
  companies,
  shops,
  activeShop,
  stocksMap,
  languageMode,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState<Product | null>(null);

  // New product form state
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [sku, setSku] = useState(`TG-${Math.floor(1000 + Math.random() * 9000)}`);
  const [companyId, setCompanyId] = useState<number>(companies[0]?.id || 1);
  const [category, setCategory] = useState('Vehicles & RC');
  const [pcsPerCarton, setPcsPerCarton] = useState<number>(50); // e.g. 1 Carton = 50 Pcs
  const [purchasePriceCarton, setPurchasePriceCarton] = useState<number>(7500);
  const [purchasePricePc, setPurchasePricePc] = useState<number>(150);
  const [sellingPriceCarton, setSellingPriceCarton] = useState<number>(10000);
  const [sellingPricePc, setSellingPricePc] = useState<number>(220);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [initialCartons, setInitialCartons] = useState<number>(10);
  const [initialLoosePcs, setInitialLoosePcs] = useState<number>(0);

  // Stock addition modal state
  const [addCartons, setAddCartons] = useState<number>(5);
  const [addLoosePcs, setAddLoosePcs] = useState<number>(0);

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameBn, setEditNameBn] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editCompanyId, setEditCompanyId] = useState<number>(companies[0]?.id || 1);
  const [editCategory, setEditCategory] = useState('');
  const [editPcsPerCarton, setEditPcsPerCarton] = useState<number>(50);
  const [editPurchasePriceCarton, setEditPurchasePriceCarton] = useState<number>(0);
  const [editPurchasePricePc, setEditPurchasePricePc] = useState<number>(0);
  const [editSellingPriceCarton, setEditSellingPriceCarton] = useState<number>(0);
  const [editSellingPricePc, setEditSellingPricePc] = useState<number>(0);
  const [editLowStockThreshold, setEditLowStockThreshold] = useState<number>(5);
  const [editDescription, setEditDescription] = useState('');

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditNameEn(p.nameEn || '');
    setEditNameBn(p.nameBn || '');
    setEditSku(p.sku || '');
    setEditCompanyId(p.companyId || companies[0]?.id || 1);
    setEditCategory(p.category || 'General');
    setEditPcsPerCarton(p.pcsPerCarton || 50);
    setEditPurchasePriceCarton(p.purchasePriceCarton || 0);
    setEditPurchasePricePc(p.purchasePricePc || 0);
    setEditSellingPriceCarton(p.sellingPriceCarton || 0);
    setEditSellingPricePc(p.sellingPricePc || 0);
    setEditLowStockThreshold(p.lowStockThresholdCartons || 5);
    setEditDescription(p.description || '');
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.id) return;
    const selectedCompObj = companies.find(c => c.id === editCompanyId);
    const compName = selectedCompObj ? selectedCompObj.name : editingProduct.companyName;

    const updatedData: Partial<Product> = {
      nameEn: editNameEn.trim(),
      nameBn: editNameBn.trim(),
      sku: editSku.trim(),
      companyId: editCompanyId,
      companyName: compName,
      category: editCategory.trim(),
      pcsPerCarton: Number(editPcsPerCarton) || 1,
      purchasePriceCarton: Number(editPurchasePriceCarton) || 0,
      purchasePricePc: Number(editPurchasePricePc) || 0,
      sellingPriceCarton: Number(editSellingPriceCarton) || 0,
      sellingPricePc: Number(editSellingPricePc) || 0,
      lowStockThresholdCartons: Number(editLowStockThreshold) || 5,
      description: editDescription.trim()
    };

    await db.products.update(editingProduct.id, updatedData);

    // Sync to localStorage
    const allProds = await db.products.toArray();
    localStorage.setItem('toy_gallery_products', JSON.stringify(allProds));

    setEditingProduct(null);
    onRefresh();
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!p.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete product "${p.nameEn}" (${p.nameBn})?\nআপনি কি নিশ্চিত এই পণ্যটি ডিলিট করতে চান?`
    );
    if (!confirmed) return;

    await db.products.delete(p.id);
    await db.stocks.where('productId').equals(p.id).delete();

    // Sync to localStorage
    const allProds = await db.products.toArray();
    localStorage.setItem('toy_gallery_products', JSON.stringify(allProds));

    onRefresh();
  };

  // Filtered products
  const filtered = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q ||
      p.nameEn.toLowerCase().includes(q) ||
      p.nameBn.includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.companyName.toLowerCase().includes(q);
    
    const matchComp = selectedCompany === 'ALL' || p.companyName === selectedCompany;

    const totalStock = stocksMap[p.id!] || 0;
    const stockCartons = p.pcsPerCarton > 0 ? Math.floor(totalStock / p.pcsPerCarton) : 0;
    const isLow = stockCartons <= p.lowStockThresholdCartons;
    const matchLow = !showLowStockOnly || isLow;

    return matchQuery && matchComp && matchLow;
  });

  // Export to Excel with UTF-8 BOM so Bangla Unicode doesn't break
  const handleExportExcel = () => {
    let csv = "SKU,Product Name (English),Product Name (Bangla),Company,Category,Carton Size (Pcs),Stock Cartons,Stock Loose Pcs,Total Pcs,Purchase Rate (Ctn),Selling Rate (Ctn),Selling Rate (Pc),Low Stock Threshold (Ctn)\n";

    products.forEach(p => {
      const totalPcs = stocksMap[p.id!] || 0;
      const ctns = p.pcsPerCarton > 0 ? Math.floor(totalPcs / p.pcsPerCarton) : 0;
      const loose = p.pcsPerCarton > 0 ? totalPcs % p.pcsPerCarton : 0;
      csv += `"${p.sku}","${p.nameEn.replace(/"/g, '""')}","${p.nameBn.replace(/"/g, '""')}","${p.companyName}","${p.category}",${p.pcsPerCarton},${ctns},${loose},${totalPcs},${p.purchasePriceCarton},${p.sellingPriceCarton},${p.sellingPricePc},${p.lowStockThresholdCartons}\n`;
    });

    exportToCsvWithBom("Toy_Gallery_Products_Master.csv", csv);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn || !nameBn) return;

    const selectedCompObj = companies.find(c => c.id === companyId);
    const compName = selectedCompObj ? selectedCompObj.name : 'General Toys';

    const newProdId = await db.products.add({
      sku: sku.trim() || `TG-${Date.now() % 10000}`,
      nameEn: nameEn.trim(),
      nameBn: nameBn.trim(),
      companyId,
      companyName: compName,
      category: category.trim(),
      pcsPerCarton: pcsPerCarton || 50,
      purchasePriceCarton: Number(purchasePriceCarton) || 0,
      purchasePricePc: Number(purchasePricePc) || 0,
      sellingPriceCarton: Number(sellingPriceCarton) || 0,
      sellingPricePc: Number(sellingPricePc) || 0,
      lowStockThresholdCartons: Number(lowStockThreshold) || 5,
    });

    // Add initial stock in the active shop
    const totalInitialPcs = (initialCartons * pcsPerCarton) + initialLoosePcs;
    await db.stocks.add({
      shopId: activeShop.id!,
      productId: newProdId,
      totalPcs: totalInitialPcs
    });

    setShowAddModal(false);
    onRefresh();
  };

  const handleSaveStock = async () => {
    if (!showStockModal) return;
    const prod = showStockModal;
    const existing = await db.stocks.where({ shopId: activeShop.id!, productId: prod.id! }).first();
    const addedPcs = (addCartons * prod.pcsPerCarton) + addLoosePcs;

    if (existing) {
      await db.stocks.update(existing.id!, { totalPcs: existing.totalPcs + addedPcs });
    } else {
      await db.stocks.add({ shopId: activeShop.id!, productId: prod.id!, totalPcs: addedPcs });
    }

    setShowStockModal(null);
    onRefresh();
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-5 flex flex-col gap-4">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span>Product Master / পণ্যের তালিকা ও কোম্পানি</span>
          </h2>
          <p className="text-xs text-slate-500">
            Outlet: <span className="font-semibold text-slate-800">{activeShop.name}</span> • Total {products.length} Products
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export with UTF-8 BOM */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg transition"
            title="Export CSV with UTF-8 BOM for Microsoft Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel Export (BOM)</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search toy in English or বাংলা (যেমন: কার, গান)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-800"
          />
        </div>

        {/* Company filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
          >
            <option value="ALL">All Companies (সকল কোম্পানি)</option>
            {companies.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Low stock alert toggle */}
        <button
          onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
            showLowStockOnly
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock Alert Filter</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] font-bold border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3">Product Name (English & Bangla)</th>
              <th className="py-2.5 px-3">Company (কোম্পানি)</th>
              <th className="py-2.5 px-3">Unit System</th>
              <th className="py-2.5 px-3 text-right">Selling Rate</th>
              <th className="py-2.5 px-3 text-center">Stock ({activeShop.name})</th>
              <th className="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => {
              const totalStockPcs = stocksMap[p.id!] || 0;
              const stockCartons = p.pcsPerCarton > 0 ? Math.floor(totalStockPcs / p.pcsPerCarton) : 0;
              const stockLoosePcs = p.pcsPerCarton > 0 ? totalStockPcs % p.pcsPerCarton : 0;
              const isLow = stockCartons <= p.lowStockThresholdCartons;

              return (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.sku}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-950">{p.nameEn}</div>
                    <div className="text-teal-700 font-medium">{p.nameBn}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {p.companyName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <span className="font-bold text-amber-700">1 Ctn = {p.pcsPerCarton} Pcs</span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="font-black text-slate-950">৳{p.sellingPriceCarton}/ctn</div>
                    <div className="text-[10px] text-slate-500">৳{p.sellingPricePc}/pc</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className={`font-bold inline-block px-2 py-0.5 rounded ${
                      isLow ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-50 text-emerald-800'
                    }`}>
                      {stockCartons} Ctn + {stockLoosePcs} Pcs
                    </div>
                    {isLow && (
                      <div className="text-[9px] text-rose-600 font-semibold mt-0.5">
                        Alert: ≤ {p.lowStockThresholdCartons} Ctn
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setShowStockModal(p)}
                        className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold shadow-sm transition"
                        title="Add Stock / মাল ইন"
                      >
                        + Stock
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-xs font-bold shadow-sm transition flex items-center justify-center"
                        title="Edit Product / এডিট করুন"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-sm transition flex items-center justify-center"
                        title="Delete Product / ডিলিট করুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 text-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-base text-slate-900 mb-1">Add Product Master / নতুন পণ্য যোগ</h3>
            <p className="text-xs text-slate-500 mb-4">Product with company, bilingual names & carton conversion</p>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Product Name English *</label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Remote Control Super Racing Car"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Product Name Bangla (ইউনিকোড) *</label>
                <input
                  type="text"
                  required
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: রিমোট কন্ট্রোল সুপার রেসিং কার"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Company / Brand *</label>
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-slate-800 font-medium"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Vehicles, Dolls, etc."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Carton Conversion: 1 Carton = X Pcs */}
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                <label className="font-bold block text-amber-950 mb-1">
                  Carton & Pcs Unit (1 Carton = ? Pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pcsPerCarton}
                  onChange={(e) => setPcsPerCarton(Number(e.target.value))}
                  placeholder="50"
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg font-black text-amber-900 outline-none"
                />
              </div>

              {/* Selling Rates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Selling Rate / Carton *</label>
                  <input
                    type="number"
                    required
                    value={sellingPriceCarton}
                    onChange={(e) => setSellingPriceCarton(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Selling Rate / Piece *</label>
                  <input
                    type="number"
                    required
                    value={sellingPricePc}
                    onChange={(e) => setSellingPricePc(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold"
                  />
                </div>
              </div>

              {/* Low stock threshold & Initial Cartons */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Low Stock Alert (Ctns)</label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Initial Cartons Stock</label>
                  <input
                    type="number"
                    value={initialCartons}
                    onChange={(e) => setInitialCartons(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900">
            <h3 className="font-black text-base text-slate-900 mb-1">Receive Stock / মাল ইন</h3>
            <p className="text-xs text-slate-600 mb-1">{showStockModal.nameEn}</p>
            <p className="text-[11px] font-bold text-amber-700 mb-3">1 Carton = {showStockModal.pcsPerCarton} Pieces</p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="font-bold block mb-1">Add Cartons (কার্টুন):</label>
                <input
                  type="number"
                  min="0"
                  value={addCartons}
                  onChange={(e) => setAddCartons(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Add Loose Pieces (খুচরা পিস):</label>
                <input
                  type="number"
                  min="0"
                  value={addLoosePcs}
                  onChange={(e) => setAddLoosePcs(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowStockModal(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStock}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
              >
                Confirm Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" />
                  <span>Edit Product / পণ্য পরিবর্তন করুন</span>
                </h3>
                <p className="text-xs text-slate-500">Update product name, rates, company & carton size</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Product Name English *</label>
                <input
                  type="text"
                  required
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Product Name Bangla (ইউনিকোড) *</label>
                <input
                  type="text"
                  required
                  value={editNameBn}
                  onChange={(e) => setEditNameBn(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-teal-800 focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Company / Brand *</label>
                  <select
                    value={editCompanyId}
                    onChange={(e) => setEditCompanyId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-medium"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Low Stock Alert (Cartons)</label>
                  <input
                    type="number"
                    min="1"
                    value={editLowStockThreshold}
                    onChange={(e) => setEditLowStockThreshold(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-rose-700"
                  />
                </div>
              </div>

              {/* Carton Conversion */}
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                <label className="font-bold block text-amber-950 mb-1">
                  Carton & Pcs Unit (1 Carton = ? Pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editPcsPerCarton}
                  onChange={(e) => setEditPcsPerCarton(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-amber-300 rounded-lg font-black text-amber-900 outline-none"
                />
              </div>

              {/* Purchase Rates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Purchase Rate / Carton (৳)</label>
                  <input
                    type="number"
                    value={editPurchasePriceCarton}
                    onChange={(e) => setEditPurchasePriceCarton(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Purchase Rate / Piece (৳)</label>
                  <input
                    type="number"
                    value={editPurchasePricePc}
                    onChange={(e) => setEditPurchasePricePc(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* Selling Rates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Selling Rate / Carton (৳) *</label>
                  <input
                    type="number"
                    required
                    value={editSellingPriceCarton}
                    onChange={(e) => setEditSellingPriceCarton(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Selling Rate / Piece (৳) *</label>
                  <input
                    type="number"
                    required
                    value={editSellingPricePc}
                    onChange={(e) => setEditSellingPricePc(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black shadow-md flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Update Product (সংরক্ষণ)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
