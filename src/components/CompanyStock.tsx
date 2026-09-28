import React, { useState } from 'react';
import { Company, Product, Shop, db } from '../db/db';
import { Building2, Package, Plus, DollarSign, Layers, Pencil, Trash2, X } from 'lucide-react';

interface CompanyStockProps {
  companies: Company[];
  products: Product[];
  activeShop: Shop;
  stocksMap: Record<number, number>;
  languageMode: 'EN' | 'BN' | 'BOTH';
  onRefresh: () => void;
}

export const CompanyStock: React.FC<CompanyStockProps> = ({
  companies,
  products,
  activeShop,
  stocksMap,
  languageMode,
  onRefresh
}) => {
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompPerson, setNewCompPerson] = useState('');
  const [newCompPhone, setNewCompPhone] = useState('');
  const [newCompAddress, setNewCompAddress] = useState('');

  // Edit company modal state
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editCompName, setEditCompName] = useState('');
  const [editCompPerson, setEditCompPerson] = useState('');
  const [editCompPhone, setEditCompPhone] = useState('');
  const [editCompAddress, setEditCompAddress] = useState('');

  const handleOpenEditCompany = (c: Company) => {
    setEditingCompany(c);
    setEditCompName(c.name || '');
    setEditCompPerson(c.contactPerson || '');
    setEditCompPhone(c.phone || '');
    setEditCompAddress(c.address || '');
  };

  const handleSaveEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany || !editingCompany.id || !editCompName.trim()) return;

    await db.companies.update(editingCompany.id, {
      name: editCompName.trim(),
      contactPerson: editCompPerson.trim(),
      phone: editCompPhone.trim(),
      address: editCompAddress.trim()
    });

    const allComps = await db.companies.toArray();
    localStorage.setItem('toy_gallery_companies', JSON.stringify(allComps));

    setEditingCompany(null);
    onRefresh();
  };

  const handleDeleteCompany = async (comp: Company) => {
    if (!comp.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete company "${comp.name}"?\nNote: Products under this company will remain.`
    );
    if (!confirmed) return;

    await db.companies.delete(comp.id);

    const allComps = await db.companies.toArray();
    localStorage.setItem('toy_gallery_companies', JSON.stringify(allComps));

    onRefresh();
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;

    await db.companies.add({
      name: newCompName.trim(),
      contactPerson: newCompPerson.trim(),
      phone: newCompPhone.trim(),
      address: newCompAddress.trim()
    });

    const allComps = await db.companies.toArray();
    localStorage.setItem('toy_gallery_companies', JSON.stringify(allComps));

    setNewCompName('');
    setNewCompPerson('');
    setNewCompPhone('');
    setNewCompAddress('');
    setShowAddCompanyModal(false);
    onRefresh();
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-5 flex flex-col gap-4">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" />
            <span>Company-wise Stock / কোম্পানি অনুযায়ী স্টক</span>
          </h2>
          <p className="text-xs text-slate-500">
            Suppliers: Aman Plastic Toy, Jihan Toy Industries, etc. • Outlet: <span className="font-semibold text-slate-800">{activeShop.name}</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddCompanyModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          <span>+ Add Toy Company</span>
        </button>
      </div>

      {/* Companies Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map(comp => {
          const compProducts = products.filter(p => p.companyId === comp.id || p.companyName === comp.name);
          
          let totalCartons = 0;
          let totalPcs = 0;
          let totalStockVal = 0;

          compProducts.forEach(p => {
            const pcs = stocksMap[p.id!] || 0;
            totalPcs += pcs;
            const ctns = p.pcsPerCarton > 0 ? Math.floor(pcs / p.pcsPerCarton) : 0;
            totalCartons += ctns;
            totalStockVal += (ctns * p.sellingPriceCarton) + (p.pcsPerCarton > 0 ? (pcs % p.pcsPerCarton) * p.sellingPricePc : 0);
          });

          return (
            <div key={comp.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                {/* Company title & contact */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-black text-base text-slate-950">{comp.name}</h3>
                    <p className="text-xs text-slate-500">
                      {comp.contactPerson ? `${comp.contactPerson} • ` : ''}
                      {comp.phone ? `${comp.phone} • ` : ''}
                      {comp.address}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                    {compProducts.length} Items
                  </span>
                </div>

                {/* Stock Stats */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5 my-3 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Cartons:</span>
                    <span className="font-black text-amber-700 text-sm">{totalCartons} Ctns</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Total Pieces:</span>
                    <span className="font-black text-slate-900 text-sm">{totalPcs} Pcs</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Stock Value:</span>
                    <span className="font-black text-emerald-700 text-sm">৳{totalStockVal}</span>
                  </div>
                </div>

                {/* Products list under this company */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Product Inventory:</div>
                  {compProducts.map(p => {
                    const pcs = stocksMap[p.id!] || 0;
                    const ctns = p.pcsPerCarton > 0 ? Math.floor(pcs / p.pcsPerCarton) : 0;
                    const loose = p.pcsPerCarton > 0 ? pcs % p.pcsPerCarton : 0;
                    const name = languageMode === 'EN' ? p.nameEn : languageMode === 'BN' ? p.nameBn : `${p.nameEn} (${p.nameBn})`;

                    return (
                      <div key={p.id} className="flex justify-between items-center text-xs py-1 border-b border-slate-100">
                        <div className="pr-2 truncate">
                          <span className="font-medium text-slate-900">{name}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">(1 Ctn = {p.pcsPerCarton} Pcs)</span>
                        </div>
                        <span className="font-bold text-slate-950 whitespace-nowrap">
                          {ctns} Ctn + {loose} Pc
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900">
            <h3 className="font-black text-base text-slate-900 mb-1">Add Toy Company / কোম্পানি যোগ</h3>
            <p className="text-xs text-slate-500 mb-3">Add toy manufacturer or supplier</p>

            <form onSubmit={handleAddCompany} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  placeholder="e.g. Aman Plastic Toy"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Contact Person</label>
                <input
                  type="text"
                  value={newCompPerson}
                  onChange={(e) => setNewCompPerson(e.target.value)}
                  placeholder="Manager / Owner name"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phone</label>
                <input
                  type="text"
                  value={newCompPhone}
                  onChange={(e) => setNewCompPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Factory / Office Address</label>
                <input
                  type="text"
                  value={newCompAddress}
                  onChange={(e) => setNewCompAddress(e.target.value)}
                  placeholder="Kamrangirchar, Dhaka or Chittagong"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCompanyModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
