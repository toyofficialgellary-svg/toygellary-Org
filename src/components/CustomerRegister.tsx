import React, { useState, useEffect } from 'react';
import { Customer, CustomerLedger, db, collectDuePayment, BANGLADESH_BANKS, exportToCsvWithBom } from '../db/db';
import { 
  Users, 
  UserPlus, 
  Receipt, 
  DollarSign, 
  Download, 
  Search, 
  X, 
  MapPin, 
  Phone,
  FileSpreadsheet,
  Pencil,
  Trash2,
  LayoutGrid,
  List
} from 'lucide-react';

interface CustomerRegisterProps {
  customers: Customer[];
  onRefresh: () => void;
}

export const CustomerRegister: React.FC<CustomerRegisterProps> = ({
  customers,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'LOCAL' | 'OUTSIDE' | 'DUE_ONLY'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('TABLE');
  
  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [viewingLedgerCustomer, setViewingLedgerCustomer] = useState<Customer | null>(null);
  const [collectingCustomer, setCollectingCustomer] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedger[]>([]);

  // Edit customer state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustName, setEditCustName] = useState('');
  const [editCustPhone, setEditCustPhone] = useState('');
  const [editCustAddress, setEditCustAddress] = useState('');
  const [editCustType, setEditCustType] = useState<'LOCAL' | 'OUTSIDE'>('LOCAL');
  const [editCustDue, setEditCustDue] = useState<number>(0);
  const [editCustNotes, setEditCustNotes] = useState('');

  // Add customer form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [customerType, setCustomerType] = useState<'LOCAL' | 'OUTSIDE'>('LOCAL');
  const [openingDue, setOpeningDue] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const handleOpenEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setEditCustName(c.name || '');
    setEditCustPhone(c.phone || '');
    setEditCustAddress(c.address || '');
    setEditCustType(c.customerType || 'LOCAL');
    setEditCustDue(c.currentDue || 0);
    setEditCustNotes(c.notes || '');
  };

  const handleSaveEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.id) return;
    const oldDue = editingCustomer.currentDue;
    const newDue = Number(editCustDue) || 0;

    await db.customers.update(editingCustomer.id, {
      name: editCustName.trim(),
      phone: editCustPhone.trim(),
      address: editCustAddress.trim(),
      customerType: editCustType,
      currentDue: newDue,
      notes: editCustNotes.trim() || undefined
    });

    if (oldDue !== newDue) {
      const diff = newDue - oldDue;
      await db.customerLedger.add({
        customerId: editingCustomer.id,
        date: Date.now(),
        type: diff > 0 ? 'OPENING_DUE' : 'PAYMENT',
        reference: 'Due Balance Adjustment (Edit)',
        debit: diff > 0 ? diff : 0,
        credit: diff < 0 ? Math.abs(diff) : 0,
        balance: newDue,
        notes: `Manual adjustment from ${oldDue} to ${newDue} TK`
      });
    }

    // Sync to localStorage
    const allCusts = await db.customers.toArray();
    localStorage.setItem('toy_gallery_customers', JSON.stringify(allCusts));

    setEditingCustomer(null);
    onRefresh();
  };

  const handleDeleteCustomer = async (c: Customer) => {
    if (!c.id) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete customer "${c.name}"?\nআপনি কি নিশ্চিত এই কাস্টমার ডিলিট করতে চান?`
    );
    if (!confirmed) return;

    await db.customers.delete(c.id);
    await db.customerLedger.where('customerId').equals(c.id).delete();

    // Sync to localStorage
    const allCusts = await db.customers.toArray();
    localStorage.setItem('toy_gallery_customers', JSON.stringify(allCusts));

    onRefresh();
  };

  // Collect due form state
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectMethod, setCollectMethod] = useState<string>('Cash');
  const [collectBank, setCollectBank] = useState<string>(BANGLADESH_BANKS[0]);
  const [collectTrxId, setCollectTrxId] = useState<string>('');
  const [collectNotes, setCollectNotes] = useState<string>('');

  // Fetch ledger when viewingLedgerCustomer changes
  useEffect(() => {
    if (viewingLedgerCustomer) {
      db.customerLedger
        .where('customerId')
        .equals(viewingLedgerCustomer.id!)
        .reverse()
        .sortBy('date')
        .then(setLedgerEntries);
    } else {
      setLedgerEntries([]);
    }
  }, [viewingLedgerCustomer]);

  // Total Outstanding Due
  const totalDueAllCustomers = customers.reduce((sum, c) => sum + c.currentDue, 0);

  // Filtered list
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.address.toLowerCase().includes(q);

    const matchType = 
      typeFilter === 'ALL' ? true :
      typeFilter === 'LOCAL' ? c.customerType === 'LOCAL' :
      typeFilter === 'OUTSIDE' ? c.customerType === 'OUTSIDE' :
      c.currentDue > 0;

    return matchQuery && matchType;
  });

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const custId = await db.customers.add({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      customerType,
      currentDue: Number(openingDue) || 0,
      notes: notes.trim() || undefined,
      createdAt: Date.now()
    });

    if (openingDue > 0) {
      await db.customerLedger.add({
        customerId: custId,
        date: Date.now(),
        type: 'OPENING_DUE',
        reference: 'Opening Due Balance',
        debit: Number(openingDue),
        credit: 0,
        balance: Number(openingDue),
        notes: 'Initial opening ledger balance'
      });
    }

    setName('');
    setPhone('');
    setAddress('');
    setOpeningDue(0);
    setNotes('');
    setShowAddCustomerModal(false);
    onRefresh();
  };

  const handleConfirmCollectDue = async () => {
    if (!collectingCustomer) return;
    const amount = Number(collectAmount) || 0;
    if (amount <= 0) return;

    await collectDuePayment({
      customer: collectingCustomer,
      amount,
      paymentMethod: collectMethod,
      bankName: collectMethod === 'Bank' ? collectBank : undefined,
      transactionId: collectTrxId.trim() || undefined,
      notes: collectNotes.trim() || undefined
    });

    setCollectAmount('');
    setCollectTrxId('');
    setCollectNotes('');
    setCollectingCustomer(null);
    onRefresh();
  };

  const handleExportLedgerExcel = (customer: Customer) => {
    let csv = `Customer:,"${customer.name}",Phone:,"${customer.phone}",Type:,"${customer.customerType}",Current Due:,"${customer.currentDue} TK"\n\n`;
    csv += "Date,Type,Reference / Description,Debit (Bill TK),Credit (Paid TK),Running Balance (Due TK),Notes\n";

    ledgerEntries.forEach(item => {
      const dateStr = new Date(item.date).toLocaleString('en-GB');
      csv += `"${dateStr}","${item.type}","${item.reference.replace(/"/g, '""')}",${item.debit},${item.credit},${item.balance},"${(item.notes || '').replace(/"/g, '""')}"\n`;
    });

    exportToCsvWithBom(`Customer_Ledger_${customer.name}.csv`, csv);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-5 flex flex-col gap-4">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Customer Register & Ledger / কাস্টমার খতিয়ান</span>
          </h2>
          <p className="text-xs text-rose-700 font-bold">
            Total Outstanding Due: ৳{totalDueAllCustomers} TK Across All Outlets
          </p>
        </div>

        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          <span>+ Add Customer (Local/Outside)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, phone, address..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-800"
          />
        </div>

        {/* Classification Filter & View Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-md flex items-center gap-1 font-bold text-xs transition ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-md flex items-center gap-1 font-bold text-xs transition ${
                viewMode === 'GRID' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition ${typeFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setTypeFilter('DUE_ONLY')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition ${typeFilter === 'DUE_ONLY' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}
          >
            Due Only ({customers.filter(c => c.currentDue > 0).length})
          </button>
          <button
            onClick={() => setTypeFilter('LOCAL')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition ${typeFilter === 'LOCAL' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Local (Chittagong)
          </button>
          <button
            onClick={() => setTypeFilter('OUTSIDE')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition ${typeFilter === 'OUTSIDE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            Outside (অন্যান্য জেলা)
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-1 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Customer / Shop Name</th>
                <th className="py-2.5 px-3">Phone & Location</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Running Net Due</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No customers found matching filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <div>{c.name}</div>
                      {c.notes && <div className="text-[10px] text-slate-400 font-normal">{c.notes}</div>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <div className="font-semibold text-slate-800">{c.phone || '-'}</div>
                      <div className="text-[11px] text-slate-500">{c.address || 'Chittagong'}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        c.customerType === 'LOCAL' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.customerType === 'LOCAL' ? 'Local (Chittagong)' : 'Outside'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-sm">
                      <span className={c.currentDue > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                        ৳{c.currentDue.toLocaleString()} TK
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingLedgerCustomer(c)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-bold transition flex items-center gap-1"
                          title="View Ledger"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </button>

                        {c.currentDue > 0 && (
                          <button
                            onClick={() => {
                              setCollectingCustomer(c);
                              setCollectAmount(String(c.currentDue));
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                            title="Collect Due"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditCustomer(c)}
                          className="p-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-xs font-bold transition flex items-center justify-center shadow-sm"
                          title="Edit Customer / পরিবর্তন করুন"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCustomer(c)}
                          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition flex items-center justify-center shadow-sm"
                          title="Delete Customer / মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Cards Grid */}
      {viewMode === 'GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCustomers.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-950">{c.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      c.customerType === 'LOCAL' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.customerType === 'LOCAL' ? 'Local (Chittagong)' : 'Outside (বাহির)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCustomer(c)}
                      className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded transition"
                      title="Edit Customer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c)}
                      className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded transition"
                      title="Delete Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right mb-2">
                  <span className="text-[10px] text-slate-500 block">Running Net Due:</span>
                  <span className={`text-base font-black ${c.currentDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    ৳{c.currentDue.toLocaleString()} TK
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.address || 'Chittagong'}</span>
                  </div>
                </div>
              </div>

              {/* Actions: View Ledger, Collect Due & Edit/Delete */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setViewingLedgerCustomer(c)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View Ledger</span>
                </button>

                {c.currentDue > 0 && (
                  <button
                    onClick={() => {
                      setCollectingCustomer(c);
                      setCollectAmount(String(c.currentDue));
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Collect Due</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 text-slate-900">
            <h3 className="font-black text-base text-slate-900 mb-1">Add New Customer / কাস্টমার যোগ</h3>
            <p className="text-xs text-slate-500 mb-4">Register customer with Local/Outside type & opening due</p>

            <form onSubmit={handleAddCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Customer Classification:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomerType('LOCAL')}
                    className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                      customerType === 'LOCAL' ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Local (Chittagong City)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType('OUTSIDE')}
                    className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                      customerType === 'OUTSIDE' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Outside (অন্যান্য জেলা)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Customer / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Al-Madina Toy Store / মোঃ ফারুক"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="018XXXXXXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Address / Location</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Anderkilla, Chittagong or Trunk Road, Feni"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Previous / Opening Due (TK) - পূর্বের বকেয়া</label>
                <input
                  type="number"
                  min="0"
                  value={openingDue || ''}
                  onChange={(e) => setOpeningDue(Number(e.target.value) || 0)}
                  placeholder="0 or 20000"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-rose-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Due Modal */}
      {collectingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900">
            <h3 className="font-black text-base text-slate-900 mb-1">Collect Customer Due / বকেয়া আদায়</h3>
            <p className="text-xs text-rose-700 font-bold mb-3">
              {collectingCustomer.name} • Current Due: ৳{collectingCustomer.currentDue} TK
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="font-bold block mb-1">Payment Received (TK) *</label>
                <input
                  type="number"
                  min="1"
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Payment Method:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Cash', 'Bank', 'bKash', 'Nagad', 'Rocket', 'Upay'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCollectMethod(m)}
                      className={`py-1 rounded-md text-xs font-bold border transition ${
                        collectMethod === m
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {collectMethod === 'Bank' && (
                <div>
                  <label className="font-bold block mb-1">Select Bank:</label>
                  <select
                    value={collectBank}
                    onChange={(e) => setCollectBank(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    {BANGLADESH_BANKS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {collectMethod !== 'Cash' && (
                <div>
                  <label className="font-bold block mb-1">Transaction ID / Cheque #</label>
                  <input
                    type="text"
                    value={collectTrxId}
                    onChange={(e) => setCollectTrxId(e.target.value)}
                    placeholder="Trx ID / Ref"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              )}

              {/* Remaining calculation preview */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 font-bold text-slate-800">
                New Remaining Due: ৳{Math.max(0, collectingCustomer.currentDue - (Number(collectAmount) || 0))} TK
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCollectingCustomer(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCollectDue}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Ledger Audit Trail Modal */}
      {viewingLedgerCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-5 text-slate-900 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start pb-3 mb-3 border-b border-slate-200">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Customer Ledger History / খতিয়ান
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  {viewingLedgerCustomer.name} ({viewingLedgerCustomer.customerType}) • Phone: {viewingLedgerCustomer.phone}
                </p>
                <p className="text-sm font-black text-rose-700 mt-1">
                  Current Net Outstanding Due: ৳{viewingLedgerCustomer.currentDue} TK
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportLedgerExcel(viewingLedgerCustomer)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel (BOM)</span>
                </button>

                <button
                  onClick={() => setViewingLedgerCustomer(null)}
                  className="p-1 text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ledger Entries Table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5">Date & Time</th>
                    <th className="py-2 px-2.5">Reference / Description</th>
                    <th className="py-2 px-2.5 text-right">Debit (Bill)</th>
                    <th className="py-2 px-2.5 text-right">Credit (Paid)</th>
                    <th className="py-2 px-2.5 text-right">Balance (Due)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(entry.date).toLocaleString('en-GB')}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-900">{entry.reference}</div>
                        {entry.notes && <div className="text-[10px] text-slate-500">{entry.notes}</div>}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-rose-700">
                        {entry.debit > 0 ? `৳${entry.debit}` : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-emerald-700">
                        {entry.credit > 0 ? `৳${entry.credit}` : '-'}
                      </td>
                      <td className="py-2 px-2.5 text-right font-black text-slate-950">
                        ৳{entry.balance} TK
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-500" />
                  <span>Edit Customer / কাস্টমার পরিবর্তন করুন</span>
                </h3>
                <p className="text-xs text-slate-500">Update customer details, classification & due balance</p>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Customer Classification:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCustType('LOCAL')}
                    className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                      editCustType === 'LOCAL' ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Local (Chittagong City)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCustType('OUTSIDE')}
                    className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                      editCustType === 'OUTSIDE' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Outside (অন্যান্য জেলা)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Customer / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Address / Location</label>
                <input
                  type="text"
                  value={editCustAddress}
                  onChange={(e) => setEditCustAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Current Due (TK) - বর্তমান বকেয়া</label>
                <input
                  type="number"
                  min="0"
                  value={editCustDue}
                  onChange={(e) => setEditCustDue(Number(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-black text-rose-700 text-sm focus:border-slate-800"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Notes / মন্তব্য</label>
                <textarea
                  rows={2}
                  value={editCustNotes}
                  onChange={(e) => setEditCustNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-black shadow-md flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Update Customer (সংরক্ষণ)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
