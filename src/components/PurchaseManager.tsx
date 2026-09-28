import React, { useState } from 'react';
import { 
  db, 
  Shop, 
  Company, 
  Product, 
  Purchase, 
  PurchaseItem, 
  PurchaseReturn,
  SupplierLedger,
  BANGLADESH_BANKS,
  processPurchase,
  processPurchaseReturn,
  paySupplierDue,
  exportToCsvWithBom
} from '../db/db';
import { 
  Truck, 
  RotateCcw, 
  BookOpen, 
  History, 
  Plus, 
  Trash2, 
  Download, 
  Building2, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface PurchaseManagerProps {
  shops: Shop[];
  activeShop: Shop;
  companies: Company[];
  products: Product[];
  languageMode: 'EN' | 'BN' | 'BOTH';
  onRefresh: () => void;
}

export function PurchaseManager({
  shops,
  activeShop,
  companies,
  products,
  languageMode,
  onRefresh
}: PurchaseManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'NEW_PURCHASE' | 'PURCHASE_RETURN' | 'SUPPLIER_DUE' | 'PURCHASE_HISTORY'>('NEW_PURCHASE');
  
  // New Purchase state
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(companies[0]?.id || 0);
  const [selectedReceivingShopId, setSelectedReceivingShopId] = useState<number>(activeShop.id || 0);
  const [cartItems, setCartItems] = useState<Array<{
    product: Product;
    cartons: number;
    loosePcs: number;
    ratePerCarton: number;
    ratePerPc: number;
    totalAmount: number;
  }>>([]);
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [inputCartons, setInputCartons] = useState<number>(1);
  const [inputLoosePcs, setInputLoosePcs] = useState<number>(0);
  const [paidNow, setPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [bankName, setBankName] = useState<string>(BANGLADESH_BANKS[0]);
  const [transactionId, setTransactionId] = useState<string>('');
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Supplier Ledger state
  const [supplierLedgerList, setSupplierLedgerList] = useState<SupplierLedger[]>([]);
  const [supplierDuesMap, setSupplierDuesMap] = useState<Record<number, number>>({});
  const [selectedLedgerCompanyId, setSelectedLedgerCompanyId] = useState<number>(companies[0]?.id || 0);

  // Pay Supplier Due modal
  const [showPayDueModal, setShowPayDueModal] = useState<Company | null>(null);
  const [payDueAmount, setPayDueAmount] = useState<number>(0);
  const [payDueMethod, setPayDueMethod] = useState<string>('Cash');
  const [payDueBank, setPayDueBank] = useState<string>(BANGLADESH_BANKS[0]);
  const [payDueTrxId, setPayDueTrxId] = useState<string>('');
  const [payDueNotes, setPayDueNotes] = useState<string>('');

  // Purchase Return state
  const [returnCompanyId, setReturnCompanyId] = useState<number>(companies[0]?.id || 0);
  const [returnShopId, setReturnShopId] = useState<number>(activeShop.id || 0);
  const [returnItems, setReturnItems] = useState<Array<{
    product: Product;
    cartons: number;
    loosePcs: number;
    ratePerCarton: number;
    ratePerPc: number;
    totalAmount: number;
  }>>([]);
  const [returnAdjustmentType, setReturnAdjustmentType] = useState<'DEDUCT_DUE' | 'CASH_REFUND'>('DEDUCT_DUE');
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Purchase History state
  const [purchaseHistory, setPurchaseHistory] = useState<Purchase[]>([]);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<{ purchase: Purchase; items: PurchaseItem[] } | null>(null);

  // Load supplier dues
  const loadSupplierData = async () => {
    const dues: Record<number, number> = {};
    for (const comp of companies) {
      if (comp.id) {
        const last = await db.supplierLedger.where('companyId').equals(comp.id).last();
        dues[comp.id] = last ? last.balance : 0;
      }
    }
    setSupplierDuesMap(dues);

    if (selectedLedgerCompanyId) {
      const ledger = await db.supplierLedger.where('companyId').equals(selectedLedgerCompanyId).toArray();
      setSupplierLedgerList(ledger.sort((a, b) => b.date - a.date));
    }

    const purchases = await db.purchases.toArray();
    setPurchaseHistory(purchases.sort((a, b) => b.date - a.date));
  };

  React.useEffect(() => {
    loadSupplierData();
  }, [companies, selectedLedgerCompanyId, activeSubTab]);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) || companies[0];
  const previousSupplierDue = selectedCompany?.id ? (supplierDuesMap[selectedCompany.id] || 0) : 0;

  // Add item to purchase cart
  const handleAddToCart = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const ratePerCarton = prod.purchasePriceCarton;
    const ratePerPc = prod.purchasePricePc;
    const totalAmount = (inputCartons * ratePerCarton) + (inputLoosePcs * ratePerPc);

    setCartItems(prev => [
      ...prev,
      {
        product: prod,
        cartons: inputCartons,
        loosePcs: inputLoosePcs,
        ratePerCarton,
        ratePerPc,
        totalAmount
      }
    ]);

    setSelectedProductId(0);
    setInputCartons(1);
    setInputLoosePcs(0);
  };

  // Remove from cart
  const handleRemoveCartItem = (idx: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculate purchase bill
  const currentPurchaseBill = cartItems.reduce((acc, it) => acc + it.totalAmount, 0);
  const totalPurchaseDue = previousSupplierDue + currentPurchaseBill;
  const netSupplierDue = Math.max(0, totalPurchaseDue - paidNow);

  // Submit Purchase
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || cartItems.length === 0) return;

    const receivingShop = shops.find(s => s.id === selectedReceivingShopId) || activeShop;

    setIsProcessing(true);
    try {
      await processPurchase({
        shop: receivingShop,
        company: selectedCompany,
        items: cartItems,
        paidNow: Number(paidNow) || 0,
        paymentMethod,
        bankName: paymentMethod === 'Bank' ? bankName : undefined,
        transactionId: transactionId.trim() || undefined,
        notes: purchaseNotes.trim() || undefined
      });

      alert(`✅ Purchase Inward saved! Added ${cartItems.length} items to ${receivingShop.name} stock.`);
      setCartItems([]);
      setPaidNow(0);
      setTransactionId('');
      setPurchaseNotes('');
      onRefresh();
      loadSupplierData();
    } catch (err: any) {
      alert(`Error saving purchase: ${err?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Pay Due Modal submission
  const handlePayDueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayDueModal || payDueAmount <= 0) return;

    try {
      await paySupplierDue({
        company: showPayDueModal,
        shop: activeShop,
        amount: payDueAmount,
        paymentMethod: payDueMethod,
        bankName: payDueMethod === 'Bank' ? payDueBank : undefined,
        transactionId: payDueTrxId.trim() || undefined,
        notes: payDueNotes.trim() || undefined
      });

      alert(`✅ Paid ${payDueAmount.toLocaleString()} TK to supplier ${showPayDueModal.name}.`);
      setShowPayDueModal(null);
      setPayDueAmount(0);
      setPayDueTrxId('');
      setPayDueNotes('');
      loadSupplierData();
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err?.message}`);
    }
  };

  // Add item to Return list
  const handleAddReturnItem = (prodId: number, ctns: number, pcs: number) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    const ratePerCarton = prod.purchasePriceCarton;
    const ratePerPc = prod.purchasePricePc;
    const totalAmount = (ctns * ratePerCarton) + (pcs * ratePerPc);

    setReturnItems(prev => [
      ...prev,
      {
        product: prod,
        cartons: ctns,
        loosePcs: pcs,
        ratePerCarton,
        ratePerPc,
        totalAmount
      }
    ]);
  };

  // Submit Purchase Return
  const handleSubmitReturn = async () => {
    const comp = companies.find(c => c.id === returnCompanyId);
    const shop = shops.find(s => s.id === returnShopId) || activeShop;
    if (!comp || returnItems.length === 0) return;

    try {
      await processPurchaseReturn({
        shop,
        company: comp,
        items: returnItems,
        adjustmentType: returnAdjustmentType,
        notes: returnNotes.trim() || undefined
      });

      alert(`✅ Purchase return processed! Stock deducted from ${shop.name} and ledger updated.`);
      setReturnItems([]);
      setReturnNotes('');
      loadSupplierData();
      onRefresh();
    } catch (err: any) {
      alert(`Error: ${err?.message}`);
    }
  };

  // Export Supplier Ledger to Excel
  const handleExportSupplierLedger = () => {
    const comp = companies.find(c => c.id === selectedLedgerCompanyId);
    if (!comp) return;

    let csv = `Date,Type,Reference,Debit (TK),Credit (TK),Running Due (TK),Notes\n`;
    supplierLedgerList.forEach(entry => {
      const dateStr = new Date(entry.date).toLocaleDateString('en-GB');
      csv += `"${dateStr}","${entry.type}","${entry.reference.replace(/"/g, '""')}","${entry.debit}","${entry.credit}","${entry.balance}","${(entry.notes || '').replace(/"/g, '""')}"\n`;
    });

    exportToCsvWithBom(`Supplier_Ledger_${comp.name.replace(/\s+/g, '_')}.csv`, csv);
  };

  // View purchase items
  const handleViewPurchaseDetails = async (purch: Purchase) => {
    const items = await db.purchaseItems.where('purchaseId').equals(purch.id!).toArray();
    setSelectedPurchaseDetails({ purchase: purch, items });
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-300 pb-2">
        <button
          onClick={() => setActiveSubTab('NEW_PURCHASE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            activeSubTab === 'NEW_PURCHASE'
              ? 'bg-slate-900 text-amber-400'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>New Purchase / স্টক ইনওয়ার্ড</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PURCHASE_RETURN')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            activeSubTab === 'PURCHASE_RETURN'
              ? 'bg-slate-900 text-amber-400'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Purchase Return / ফেরত</span>
        </button>

        <button
          onClick={() => setActiveSubTab('SUPPLIER_DUE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            activeSubTab === 'SUPPLIER_DUE'
              ? 'bg-slate-900 text-amber-400'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Supplier Due & Ledger / মহাজন খতিয়ান</span>
        </button>

        <button
          onClick={() => setActiveSubTab('PURCHASE_HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            activeSubTab === 'PURCHASE_HISTORY'
              ? 'bg-slate-900 text-amber-400'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Purchase History / বিল ইতিহাস</span>
        </button>
      </div>

      {/* 1. NEW PURCHASE INWARD */}
      {activeSubTab === 'NEW_PURCHASE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Cols: Form & Item Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header selection card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Supplier (মহাজন / কোম্পানি):</label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.address})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Receiving Shop / Godown (স্টক রিসিভ শপ):</label>
                <select
                  value={selectedReceivingShopId}
                  onChange={(e) => setSelectedReceivingShopId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 outline-none"
                >
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isMain ? '(Main Showroom)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product selection card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-xs space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Select Product & Quantity (পণ্য ও কার্টুন / পিস যোগ করুন)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Product:</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold outline-none"
                  >
                    <option value={0}>-- Select Product --</option>
                    {products
                      .filter(p => !selectedCompanyId || p.companyId === selectedCompanyId)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {languageMode === 'BN' ? p.nameBn : languageMode === 'EN' ? p.nameEn : `${p.nameEn} | ${p.nameBn}`} (1 Ctn = {p.pcsPerCarton} Pcs)
                        </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cartons (কার্টুন):</label>
                  <input
                    type="number"
                    min="0"
                    value={inputCartons}
                    onChange={(e) => setInputCartons(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-center outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Loose Pcs (পিস):</label>
                  <input
                    type="number"
                    min="0"
                    value={inputLoosePcs}
                    onChange={(e) => setInputLoosePcs(Number(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-center outline-none"
                  />
                </div>
              </div>

              {selectedProductId > 0 && (() => {
                const prod = products.find(p => p.id === selectedProductId);
                if (!prod) return null;
                const estAmount = (inputCartons * prod.purchasePriceCarton) + (inputLoosePcs * prod.purchasePricePc);
                const totalPcs = (inputCartons * prod.pcsPerCarton) + inputLoosePcs;
                return (
                  <div className="flex flex-wrap items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-bold">
                    <span>
                      1 Ctn Rate: {prod.purchasePriceCarton.toLocaleString()} TK | 1 Pc Rate: {prod.purchasePricePc} TK | Total: {totalPcs} Pcs
                    </span>
                    <span className="text-sm text-emerald-800">
                      Amount: {estAmount.toLocaleString()} TK
                    </span>
                  </div>
                );
              })()}

              <button
                type="button"
                disabled={selectedProductId === 0 || (inputCartons === 0 && inputLoosePcs === 0)}
                onClick={handleAddToCart}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" />
                Add Item to Inward Cart / তালিকায় যোগ করুন
              </button>
            </div>

            {/* Cart Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                <span>Inward Cart Items ({cartItems.length} items)</span>
                <span className="text-emerald-700">Subtotal: {currentPurchaseBill.toLocaleString()} TK</span>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  No items added yet. Select a product above and click "Add Item".
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-center">Cartons</th>
                        <th className="p-2.5 text-center">Loose Pcs</th>
                        <th className="p-2.5 text-center">Total Pcs</th>
                        <th className="p-2.5 text-right">Carton Rate</th>
                        <th className="p-2.5 text-right">Amount (TK)</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cartItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900">
                              {languageMode === 'BN' ? item.product.nameBn : item.product.nameEn}
                            </p>
                            <p className="text-[10px] text-slate-500">{item.product.companyName}</p>
                          </td>
                          <td className="p-2.5 text-center font-bold text-amber-700">{item.cartons} Ctn</td>
                          <td className="p-2.5 text-center font-bold text-slate-700">{item.loosePcs} Pcs</td>
                          <td className="p-2.5 text-center font-bold text-slate-900">
                            {(item.cartons * item.product.pcsPerCarton) + item.loosePcs}
                          </td>
                          <td className="p-2.5 text-right">{item.ratePerCarton.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-black text-emerald-800">
                            {item.totalAmount.toLocaleString()}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Bill & Running Due Logic */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-xs space-y-4">
            <h3 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100">
              Supplier Running Due & Payment
            </h3>

            {/* Calculations breakdown */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-slate-600">
                <span>Supplier Previous Due:</span>
                <span className="font-bold text-rose-700 text-sm">
                  {previousSupplierDue.toLocaleString()} TK
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600">
                <span>Current Inward Bill:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentPurchaseBill.toLocaleString()} TK
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                <span>Total Supplier Payable:</span>
                <span className="text-base text-amber-700">
                  {totalPurchaseDue.toLocaleString()} TK
                </span>
              </div>
            </div>

            {/* Paid Now Input */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Paid Now (এখন পরিশোধ) TK:
              </label>
              <input
                type="number"
                min="0"
                value={paidNow || ''}
                onChange={(e) => setPaidNow(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-emerald-800 text-base outline-none"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setPaidNow(0)}
                  className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600"
                >
                  Clear (Full Due)
                </button>
                <button
                  type="button"
                  onClick={() => setPaidNow(currentPurchaseBill)}
                  className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-emerald-700"
                >
                  Pay Current Bill
                </button>
                <button
                  type="button"
                  onClick={() => setPaidNow(totalPurchaseDue)}
                  className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-blue-700"
                >
                  Pay Total Due
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">Payment Method:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer / Cheque</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket</option>
                <option value="Upay">Upay</option>
              </select>
            </div>

            {paymentMethod === 'Bank' && (
              <div>
                <label className="font-bold text-slate-800 block mb-1">Bank Name:</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                >
                  {BANGLADESH_BANKS.map((b, i) => (
                    <option key={i} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {paymentMethod !== 'Cash' && (
              <div>
                <label className="font-bold text-slate-800 block mb-1">Trx ID / Cheque No:</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. TR-894728"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>
            )}

            {/* Net Remaining Supplier Due Result */}
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[11px] text-rose-800 block font-bold">New Net Supplier Due (নতুন বাকি):</span>
              <span className="text-xl font-black text-rose-700">
                {netSupplierDue.toLocaleString()} TK
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Will be automatically updated in {selectedCompany?.name} ledger.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Notes / Remarks:</label>
              <input
                type="text"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="e.g. Consignment truck Dhaka-Ctg"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing || cartItems.length === 0}
              onClick={handleSubmitPurchase}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-black text-sm transition shadow-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Confirm & Stock Inward / নিশ্চিত করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. PURCHASE RETURN */}
      {activeSubTab === 'PURCHASE_RETURN' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-black text-base text-slate-900">Purchase Return / মহাজনকে পণ্য ফেরত</h3>
              <p className="text-slate-500">Return damaged or unsold stock to supplier & adjust dues or receive refund</p>
            </div>

            <div className="flex gap-2">
              <select
                value={returnCompanyId}
                onChange={(e) => setReturnCompanyId(Number(e.target.value))}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={returnShopId}
                onChange={(e) => setReturnShopId(Number(e.target.value))}
                className="p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
              >
                {shops.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Select for Return */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800">Add Return Item</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <select
                  id="returnProdSelect"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                >
                  <option value="">-- Choose Product --</option>
                  {products
                    .filter(p => !returnCompanyId || p.companyId === returnCompanyId)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nameEn} ({p.companyName})
                      </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  id="returnCtnsInput"
                  type="number"
                  min="0"
                  defaultValue="1"
                  placeholder="Cartons"
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-center font-bold"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const select = document.getElementById('returnProdSelect') as HTMLSelectElement;
                  const input = document.getElementById('returnCtnsInput') as HTMLInputElement;
                  const prodId = Number(select?.value);
                  const ctns = Number(input?.value) || 0;
                  if (prodId > 0 && ctns > 0) {
                    handleAddReturnItem(prodId, ctns, 0);
                  }
                }}
                className="py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow"
              >
                + Add to Return
              </button>
            </div>
          </div>

          {/* Return items table */}
          {returnItems.length > 0 && (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold text-[11px]">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-center">Cartons</th>
                    <th className="p-2.5 text-right">Rate / Ctn</th>
                    <th className="p-2.5 text-right">Total Refund (TK)</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-900">{item.product.nameEn}</td>
                      <td className="p-2.5 text-center font-bold">{item.cartons}</td>
                      <td className="p-2.5 text-right">{item.ratePerCarton.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-black text-rose-700">{item.totalAmount.toLocaleString()}</td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => setReturnItems(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Adjustment mode & notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="font-bold block mb-1">Adjustment Type:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReturnAdjustmentType('DEDUCT_DUE')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition ${
                    returnAdjustmentType === 'DEDUCT_DUE'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Deduct from Supplier Due
                </button>
                <button
                  type="button"
                  onClick={() => setReturnAdjustmentType('CASH_REFUND')}
                  className={`flex-1 py-2 rounded-xl font-bold border transition ${
                    returnAdjustmentType === 'CASH_REFUND'
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Cash Refund
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Return Reason / Notes:</label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="e.g. Broken pieces in carton"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={returnItems.length === 0}
            onClick={handleSubmitReturn}
            className="w-full py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition shadow"
          >
            Confirm Purchase Return (স্টক ও বাকি সমন্বয়)
          </button>
        </div>
      )}

      {/* 3. SUPPLIER DUE & LEDGER */}
      {activeSubTab === 'SUPPLIER_DUE' && (
        <div className="space-y-4">
          {/* Supplier Cards with Dues */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {companies.map(comp => {
              const due = supplierDuesMap[comp.id!] || 0;
              const isSelected = comp.id === selectedLedgerCompanyId;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedLedgerCompanyId(comp.id!)}
                  className={`cursor-pointer p-4 rounded-2xl border transition shadow-sm bg-white ${
                    isSelected ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-slate-900 text-xs">{comp.name}</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">{comp.contactPerson} ({comp.phone})</p>
                  
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold">Outstanding Due:</span>
                    <span className={`font-black text-sm ${due > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {due.toLocaleString()} TK
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPayDueModal(comp);
                      setPayDueAmount(due);
                    }}
                    className="w-full mt-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Pay Supplier / বিল দিন
                  </button>
                </div>
              );
            })}
          </div>

          {/* Selected Supplier Ledger Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Supplier Ledger: {companies.find(c => c.id === selectedLedgerCompanyId)?.name}
                </h4>
                <p className="text-slate-500 text-[11px]">Chronological record of stock inward bills, payments & returns</p>
              </div>

              <button
                type="button"
                onClick={handleExportSupplierLedger}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to Excel (UTF-8 BOM)</span>
              </button>
            </div>

            {supplierLedgerList.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                No ledger transactions found for this company.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Reference / Bill</th>
                      <th className="p-3 text-right">Debit / Paid (TK)</th>
                      <th className="p-3 text-right">Credit / Bill (TK)</th>
                      <th className="p-3 text-right">Running Due (TK)</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supplierLedgerList.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 font-semibold text-slate-700">
                          {new Date(entry.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            entry.type === 'PURCHASE' ? 'bg-amber-100 text-amber-800' :
                            entry.type === 'PAYMENT' ? 'bg-emerald-100 text-emerald-800' :
                            entry.type === 'RETURN' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">{entry.reference}</td>
                        <td className="p-3 text-right font-black text-emerald-700">
                          {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-rose-700">
                          {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          {entry.balance.toLocaleString()} TK
                        </td>
                        <td className="p-3 text-slate-500">{entry.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PURCHASE HISTORY */}
      {activeSubTab === 'PURCHASE_HISTORY' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
            <span>All Purchase Bills ({purchaseHistory.length})</span>
            <span className="text-slate-500 font-normal">Click any row to view items</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-3">Purchase #</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Receiving Shop</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Bill (TK)</th>
                  <th className="p-3 text-right">Paid (TK)</th>
                  <th className="p-3 text-right">Due (TK)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseHistory.map((purch, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 font-black text-amber-700">{purch.purchaseNumber}</td>
                    <td className="p-3 font-bold text-slate-900">{purch.companyName}</td>
                    <td className="p-3 text-slate-700">{purch.shopName}</td>
                    <td className="p-3 text-slate-500">{new Date(purch.date).toLocaleDateString('en-GB')}</td>
                    <td className="p-3 text-right font-bold">{purch.totalAmount.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">{purch.paidNow.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-rose-700">{purch.dueAmount.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewPurchaseDetails(purch)}
                        className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold"
                      >
                        View Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pay Due Modal */}
      {showPayDueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900">
            <h3 className="font-black text-base mb-1">Pay Supplier Due / মহাজনকে পেমেন্ট</h3>
            <p className="text-xs text-slate-500 mb-3">{showPayDueModal.name}</p>

            <form onSubmit={handlePayDueSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Payment Amount (TK) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payDueAmount || ''}
                  onChange={(e) => setPayDueAmount(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-emerald-800 text-base outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Method:</label>
                <select
                  value={payDueMethod}
                  onChange={(e) => setPayDueMethod(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                </select>
              </div>

              {payDueMethod === 'Bank' && (
                <div>
                  <label className="font-bold block mb-1">Bank:</label>
                  <select
                    value={payDueBank}
                    onChange={(e) => setPayDueBank(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  >
                    {BANGLADESH_BANKS.map((b, i) => (
                      <option key={i} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {payDueMethod !== 'Cash' && (
                <div>
                  <label className="font-bold block mb-1">Trx ID / Cheque No:</label>
                  <input
                    type="text"
                    value={payDueTrxId}
                    onChange={(e) => setPayDueTrxId(e.target.value)}
                    placeholder="e.g. TR-89472"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              )}

              <div>
                <label className="font-bold block mb-1">Notes:</label>
                <input
                  type="text"
                  value={payDueNotes}
                  onChange={(e) => setPayDueNotes(e.target.value)}
                  placeholder="Notes"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayDueModal(null)}
                  className="px-3 py-1.5 bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Details Modal */}
      {selectedPurchaseDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 text-slate-900 text-xs space-y-3">
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <h3 className="font-black text-sm">Purchase Bill: {selectedPurchaseDetails.purchase.purchaseNumber}</h3>
                <p className="text-slate-500">{selectedPurchaseDetails.purchase.companyName} → {selectedPurchaseDetails.purchase.shopName}</p>
              </div>
              <button
                onClick={() => setSelectedPurchaseDetails(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold text-[10px]">
                  <tr>
                    <th className="p-2">Item</th>
                    <th className="p-2 text-center">Cartons</th>
                    <th className="p-2 text-center">Loose</th>
                    <th className="p-2 text-right">Rate</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedPurchaseDetails.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-bold">{it.productNameEn}</td>
                      <td className="p-2 text-center">{it.cartonsQuantity}</td>
                      <td className="p-2 text-center">{it.pcsQuantity}</td>
                      <td className="p-2 text-right">{it.ratePerCarton.toLocaleString()}</td>
                      <td className="p-2 text-right font-bold">{it.totalAmount.toLocaleString()} TK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 border-t flex justify-between font-bold">
              <span>Total Bill: {selectedPurchaseDetails.purchase.totalAmount.toLocaleString()} TK</span>
              <span className="text-emerald-700">Paid: {selectedPurchaseDetails.purchase.paidNow.toLocaleString()} TK</span>
              <span className="text-rose-700">Due: {selectedPurchaseDetails.purchase.dueAmount.toLocaleString()} TK</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
