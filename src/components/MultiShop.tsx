import React, { useState } from 'react';
import { Shop, db } from '../db/db';
import { Store, Plus, CheckCircle, MapPin, Phone, Pencil, Trash2, X } from 'lucide-react';

interface MultiShopProps {
  shops: Shop[];
  activeShop: Shop;
  onSelectShop: (shop: Shop) => void;
  onRefresh: () => void;
}

export const MultiShop: React.FC<MultiShopProps> = ({
  shops,
  activeShop,
  onSelectShop,
  onRefresh
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isMain, setIsMain] = useState(false);

  // Edit shop state
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsMain, setEditIsMain] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  const handleOpenEditShop = (shop: Shop) => {
    setEditingShop(shop);
    setEditName(shop.name || '');
    setEditAddress(shop.address || '');
    setEditPhone(shop.phone || '');
    setEditIsMain(shop.isMain || false);
    setEditIsActive(shop.isActive !== false);
  };

  const handleSaveEditShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop || !editingShop.id || !editName.trim() || !editAddress.trim()) return;

    if (editIsMain) {
      const all = await db.shops.toArray();
      for (const s of all) {
        if (s.id && s.id !== editingShop.id && s.isMain) {
          await db.shops.update(s.id, { isMain: false });
        }
      }
    }

    await db.shops.update(editingShop.id, {
      name: editName.trim(),
      address: editAddress.trim(),
      phone: editPhone.trim(),
      isMain: editIsMain,
      isActive: editIsActive
    });

    const updatedShops = await db.shops.toArray();
    localStorage.setItem('toy_gallery_shops', JSON.stringify(updatedShops));

    setEditingShop(null);
    onRefresh();
  };

  const handleDeleteShop = async (shop: Shop) => {
    if (!shop.id) return;
    if (shops.length <= 1) {
      alert("Cannot delete the only remaining shop! You must have at least one active shop.");
      return;
    }
    const confirmed = window.confirm(
      `Are you sure you want to delete outlet "${shop.name}"?\nআপনি কি নিশ্চিত এই ব্রাঞ্চ/গোডাউন ডিলিট করতে চান?`
    );
    if (!confirmed) return;

    await db.shops.delete(shop.id);
    await db.stocks.where('shopId').equals(shop.id).delete();

    const updatedShops = await db.shops.toArray();
    localStorage.setItem('toy_gallery_shops', JSON.stringify(updatedShops));

    if (shop.id === activeShop.id) {
      const fallback = updatedShops.find(s => s.isMain) || updatedShops[0];
      if (fallback) onSelectShop(fallback);
    }

    onRefresh();
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    if (isMain) {
      const all = await db.shops.toArray();
      for (const s of all) {
        if (s.id && s.isMain) {
          await db.shops.update(s.id, { isMain: false });
        }
      }
    }

    await db.shops.add({
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      isMain,
      isActive: true
    });

    const updatedShops = await db.shops.toArray();
    localStorage.setItem('toy_gallery_shops', JSON.stringify(updatedShops));

    setName('');
    setAddress('');
    setPhone('');
    setIsMain(false);
    setShowAddModal(false);
    onRefresh();
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-teal-600" />
            <span>Multi-Shop Management / মাল্টি-শপ ব্রাঞ্চ</span>
          </h2>
          <p className="text-xs text-slate-500">
            Manage unlimited shops, outlets & godowns in Chittagong
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ Add New Outlet / Godown</span>
        </button>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shops.map(shop => {
          const isActive = shop.id === activeShop.id;

          return (
            <div
              key={shop.id}
              className={`bg-white rounded-xl p-4 shadow-sm border transition flex flex-col justify-between ${
                isActive ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
                      <Store className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-950">{shop.name}</h3>
                      {shop.isMain && (
                        <span className="text-[9px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded">
                          Main Showroom
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenEditShop(shop)}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition"
                      title="Edit Shop / ব্রাঞ্চ পরিবর্তন"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteShop(shop)}
                      className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg transition"
                      title="Delete Shop / ব্রাঞ্চ মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 my-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{shop.address}</span>
                  </div>
                  {shop.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{shop.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {!isActive ? (
                <button
                  onClick={() => onSelectShop(shop)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-bold transition"
                >
                  Switch POS to this Shop
                </button>
              ) : (
                <div className="text-center py-1.5 text-xs text-teal-700 font-bold bg-teal-50 rounded-lg border border-teal-200">
                  Currently Active POS Outlet
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Shop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900">
            <h3 className="font-black text-base text-slate-900 mb-1">Add Outlet / ব্রাঞ্চ যোগ</h3>
            <p className="text-xs text-slate-500 mb-4">Add new store, showroom, or warehouse</p>

            <form onSubmit={handleAddShop} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Shop / Godown Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Toy Gallery - Muradpur Branch"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Address / Location *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. CDA Avenue, Chittagong"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isMain"
                  checked={isMain}
                  onChange={(e) => setIsMain(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900"
                />
                <label htmlFor="isMain" className="font-bold text-slate-800">
                  Set as Main Showroom
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Create Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Shop Modal */}
      {editingShop && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" />
                  <span>Edit Outlet / ব্রাঞ্চ পরিবর্তন</span>
                </h3>
                <p className="text-xs text-slate-500">Update showroom / godown details</p>
              </div>
              <button
                onClick={() => setEditingShop(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditShop} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Shop / Godown Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Address / Location *</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-slate-800 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsMain"
                  checked={editIsMain}
                  onChange={(e) => setEditIsMain(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900"
                />
                <label htmlFor="editIsMain" className="font-bold text-slate-800">
                  Set as Main Showroom
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900"
                />
                <label htmlFor="editIsActive" className="font-bold text-slate-800">
                  Active Outlet
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingShop(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black flex items-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Update Outlet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
