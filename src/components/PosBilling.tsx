import React, { useState, useMemo } from 'react';
import { 
  Customer, 
  Product, 
  Shop, 
  BANGLADESH_BANKS, 
  processSaleInvoice, 
  Invoice, 
  InvoiceItem, 
  db 
} from '../db/db';
import { 
  Search, 
  UserPlus, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard,
  Building,
  DollarSign,
  Package,
  Layers
} from 'lucide-react';

interface CartItem {
  product: Product;
  cartons: number;
  loosePcs: number;
  ratePerCarton: number;
  ratePerPc: number;
  totalAmount: number;
}

interface PosBillingProps {
  activeShop: Shop;
  products: Product[];
  customers: Customer[];
  stocksMap: Record<number, number>; // productId -> totalPcs
  languageMode: 'EN' | 'BN' | 'BOTH';
  onInvoiceCreated: (invoice: Invoice, items: InvoiceItem[]) => void;
  onAddNewCustomer: () => void;
}

export const PosBilling: React.FC<PosBillingProps> = ({
  activeShop,
  products,
  customers,
  stocksMap,
  languageMode,
  onInvoiceCreated,
  onAddNewCustomer
}) => {
  // State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(
    customers.length > 0 ? customers[0].id! : ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidNow, setPaidNow] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [selectedBank, setSelectedBank] = useState<string>(BANGLADESH_BANKS[0]);
  const [transactionId, setTransactionId] = useState<string>('');
  const [billingNotes, setBillingNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Selected customer entity
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === Number(selectedCustomerId));
  }, [customers, selectedCustomerId]);

  // Companies list
  const companiesList = useMemo(() => {
    const set = new Set(products.map(p => p.companyName));
    return Array.from(set);
  }, [products]);

  // Filtered products (Bilingual search)
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const matchQuery = !q || 
        p.nameEn.toLowerCase().includes(q) ||
        p.nameBn.includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      const matchCompany = selectedCompanyFilter === 'ALL' || p.companyName === selectedCompanyFilter;
      return matchQuery && matchCompany;
    });
  }, [products, searchQuery, selectedCompanyFilter]);

  // Calculations (Module 2 Running Due Logic)
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalAmount, 0);
  }, [cart]);

  const currentBill = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  // Auto show Previous Due!
  const previousDue = selectedCustomer?.currentDue || 0;

  // Total Due = Previous Due + Current Bill (e.g. 20000 + 100000 = 120000)
  const totalDue = previousDue + currentBill;

  const paidNowNum = Number(paidNow) || 0;

  // Due of this bill
  const billDue = Math.max(0, currentBill - paidNowNum);

  // New Net Due = Total Due - Paid Now (e.g. 120000 - 60000 = 60000 auto added to ledger)
  const newNetDue = Math.max(0, totalDue - paidNowNum);

  // Cart actions
  const addToCart = (product: Product, cartons = 1, loosePcs = 0) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newCtns = existing.cartons + cartons;
        const newLoose = existing.loosePcs + loosePcs;
        const total = (newCtns * existing.ratePerCarton) + (newLoose * existing.ratePerPc);
        return prev.map(item => item.product.id === product.id ? {
          ...item,
          cartons: newCtns,
          loosePcs: newLoose,
          totalAmount: total
        } : item);
      } else {
        const total = (cartons * product.sellingPriceCarton) + (loosePcs * product.sellingPricePc);
        return [...prev, {
          product,
          cartons,
          loosePcs,
          ratePerCarton: product.sellingPriceCarton,
          ratePerPc: product.sellingPricePc,
          totalAmount: total
        }];
      }
    });
  };

  const updateCartQty = (productId: number, deltaCtns: number, deltaPcs: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id !== productId) return item;
        const newCtns = Math.max(0, item.cartons + deltaCtns);
        const newPcs = Math.max(0, item.loosePcs + deltaPcs);
        const total = (newCtns * item.ratePerCarton) + (newPcs * item.ratePerPc);
        return {
          ...item,
          cartons: newCtns,
          loosePcs: newPcs,
          totalAmount: total
        };
      }).filter(item => item.cartons > 0 || item.loosePcs > 0);
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      setErrorMsg("Please select or add a customer first");
      return;
    }
    if (cart.length === 0) {
      setErrorMsg("Cart is empty. Please add products.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const invoice = await processSaleInvoice({
        shop: activeShop,
        customer: selectedCustomer,
        items: cart,
        discount,
        paidNow: paidNowNum,
        paymentMethod,
        bankName: paymentMethod === 'Bank' ? selectedBank : undefined,
        transactionId: transactionId.trim() || undefined,
        notes: billingNotes.trim() || undefined
      });

      // Fetch saved items
      const items = await db.invoiceItems.where('invoiceId').equals(invoice.id!).toArray();

      // Reset cart and inputs
      setCart([]);
      setDiscount(0);
      setPaidNow('');
      setTransactionId('');
      setBillingNotes('');

      // Open print modal
      onInvoiceCreated(invoice, items);
    } catch (err: any) {
      setErrorMsg("Checkout failed: " + (err.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-3 md:p-5 max-w-7xl mx-auto w-full">
      
      {/* Left Column: Customer Selector & Products Catalog (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        
        {/* Customer Select + Previous Due Card (Module 2 Requirement) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm text-white">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Select Customer / ক্রেতা *</span>
            </label>
            <button
              onClick={onAddNewCustomer}
              className="flex items-center gap-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add New Customer</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-teal-500"
            >
              <option value="">-- Choose Customer / কাস্টমার নির্বাচন করুন --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customerType}) • Due: ৳{c.currentDue}
                </option>
              ))}
            </select>
          </div>

          {/* Previous Due Banner (Auto show Previous Due) */}
          {selectedCustomer && (
            <div className={`mt-2.5 p-2.5 rounded-lg flex items-center justify-between text-xs font-bold border ${
              previousDue > 0 
                ? 'bg-rose-950/80 border-rose-800 text-rose-200' 
                : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                <span>Previous Due (পূর্বের বকেয়া):</span>
                <span className="text-sm font-black underline">৳{previousDue} TK</span>
              </div>
              <span className="text-[11px] font-normal text-slate-400">
                Type: {selectedCustomer.customerType} • {selectedCustomer.phone || selectedCustomer.address}
              </span>
            </div>
          )}
        </div>

        {/* Catalog Search & Company Filter */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search toys in English / বাংলায় খুঁজুন (যেমন: কার, গান, বন্দুক)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs md:text-sm outline-none focus:border-slate-800 focus:bg-white text-slate-900"
            />
          </div>

          {/* Company Filter Chips (Module 1 Requirement) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 text-[11px] font-semibold whitespace-nowrap">Company:</span>
            <button
              onClick={() => setSelectedCompanyFilter('ALL')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition ${
                selectedCompanyFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Companies ({products.length})
            </button>
            {companiesList.map(comp => (
              <button
                key={comp}
                onClick={() => setSelectedCompanyFilter(comp)}
                className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition ${
                  selectedCompanyFilter === comp
                    ? 'bg-teal-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[500px] pr-1">
          {filteredProducts.map(p => {
            const totalStockPcs = stocksMap[p.id!] || 0;
            const stockCartons = p.pcsPerCarton > 0 ? Math.floor(totalStockPcs / p.pcsPerCarton) : 0;
            const stockLoosePcs = p.pcsPerCarton > 0 ? totalStockPcs % p.pcsPerCarton : 0;
            const isLowStock = stockCartons <= p.lowStockThresholdCartons;

            const name = languageMode === 'EN' ? p.nameEn : languageMode === 'BN' ? p.nameBn : `${p.nameEn} (${p.nameBn})`;

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-3 shadow-sm flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex justify-between items-start gap-1 mb-1">
                    <h3 className="font-bold text-xs text-slate-950 leading-snug line-clamp-2">
                      {name}
                    </h3>
                    {isLowStock && (
                      <span className="text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded whitespace-nowrap">
                        Low Stock!
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 mb-2">
                    <span className="font-semibold text-teal-700">{p.companyName}</span> • 1 Ctn = {p.pcsPerCarton} Pcs
                  </div>

                  {/* Stock & Price info */}
                  <div className="bg-slate-50 rounded-lg p-2 text-xs mb-2.5 border border-slate-100 flex justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Current Stock:</span>
                      <span className={`font-bold ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>
                        {stockCartons} Ctn + {stockLoosePcs} Pcs
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Rate:</span>
                      <span className="font-black text-slate-900">৳{p.sellingPriceCarton} / Ctn</span>
                      <span className="text-[10px] text-slate-500 block">(৳{p.sellingPricePc}/pc)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Add Buttons: +1 Carton or +1 Loose Pc */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => addToCart(p, 1, 0)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+1 Carton</span>
                  </button>
                  <button
                    onClick={() => addToCart(p, 0, 1)}
                    className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold transition"
                    title="Add 1 Loose Piece"
                  >
                    +1 Pc
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Right Column: POS Cart & Running Due Calculation (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        
        {/* Cart Items List */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-500" />
              <span>Cart Items ({cart.length})</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Cart is empty. Select toys from the catalog.
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {cart.map(item => {
                const name = languageMode === 'EN' ? item.product.nameEn : languageMode === 'BN' ? item.product.nameBn : item.product.nameEn;
                return (
                  <div key={item.product.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{name}</div>
                      <div className="text-[10px] text-slate-500">
                        1 Ctn={item.product.pcsPerCarton}Pc • ৳{item.ratePerCarton}/Ctn • ৳{item.ratePerPc}/Pc
                      </div>
                    </div>

                    {/* Steppers */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-slate-200 rounded-md">
                        <button
                          onClick={() => updateCartQty(item.product.id!, -1, 0)}
                          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1 text-[11px] font-bold text-slate-900">{item.cartons}C</span>
                        <button
                          onClick={() => updateCartQty(item.product.id!, 1, 0)}
                          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center bg-white border border-slate-200 rounded-md">
                        <button
                          onClick={() => updateCartQty(item.product.id!, 0, -1)}
                          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1 text-[11px] font-bold text-slate-900">{item.loosePcs}P</span>
                        <button
                          onClick={() => updateCartQty(item.product.id!, 0, 1)}
                          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-14 text-right font-black text-slate-950">
                        ৳{item.totalAmount}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id!)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RUNNING DUE BILLING CALCULATION (Most Important Logic) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs space-y-3">
          <h3 className="font-bold text-sm text-slate-950 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>Billing & Running Due / হিসাব</span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-semibold">
              Shop: {activeShop.name}
            </span>
          </h3>

          {/* Subtotal & Discount */}
          <div className="space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-slate-900">৳{subtotal}</span>
            </div>

            <div className="flex items-center justify-between">
              <span>Discount (ছাড়):</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded text-right font-bold text-slate-900 outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-2 space-y-1.5">
            {/* CURRENT BILL (e.g. 100000) */}
            <div className="flex justify-between text-sm font-bold text-slate-950">
              <span>Current Bill (বর্তমান বিল):</span>
              <span>৳{currentBill}</span>
            </div>

            {/* PREVIOUS DUE (e.g. 20000) */}
            <div className="flex justify-between font-bold text-rose-700">
              <span>Previous Due (পূর্বের বকেয়া):</span>
              <span>৳{previousDue}</span>
            </div>

            {/* TOTAL DUE = PREVIOUS DUE + CURRENT BILL (e.g. 120000) */}
            <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-2 rounded-lg font-black text-amber-900 text-xs">
              <span>TOTAL DUE (পূর্বের + বর্তমান বিল):</span>
              <span className="text-sm">৳{totalDue} TK</span>
            </div>
          </div>

          {/* PAID NOW INPUT (e.g. 60000) */}
          <div className="border-t border-slate-200 pt-2 space-y-2">
            <label className="font-bold text-slate-950 block">
              Paid Now (এখন জমা দেওয়া হয়েছে) *:
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={paidNow}
                onChange={(e) => setPaidNow(e.target.value)}
                placeholder="Enter paid amount (TK)"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black text-slate-900 outline-none focus:border-slate-900 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setPaidNow(String(currentBill))}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold whitespace-nowrap"
              >
                Pay Bill (৳{currentBill})
              </button>
              <button
                type="button"
                onClick={() => setPaidNow(String(totalDue))}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold whitespace-nowrap"
              >
                Pay Total (৳{totalDue})
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 block">Payment Method:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {['Cash', 'Bank', 'bKash', 'Nagad', 'Rocket', 'Upay'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1 rounded-md text-xs font-bold border transition ${
                      paymentMethod === m
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* If Bank selected, show all Bangladeshi Banks */}
            {paymentMethod === 'Bank' && (
              <div className="space-y-1 pt-1">
                <span className="text-[11px] font-semibold text-slate-600 block">Select Bangladeshi Bank:</span>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium outline-none focus:border-slate-900"
                >
                  {BANGLADESH_BANKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Transaction ID */}
            {paymentMethod !== 'Cash' && (
              <div className="space-y-1 pt-1">
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Transaction ID / Cheque # / Ref..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            )}
          </div>

          {/* NEW NET DUE = TOTAL DUE - PAID NOW (e.g. 60000 auto added to ledger) */}
          <div className="border-t border-slate-200 pt-2 space-y-1">
            <div className="flex justify-between text-slate-700">
              <span>Due of this Bill (এই বিলের বকেয়া):</span>
              <span className="font-semibold">৳{billDue}</span>
            </div>

            <div className="flex justify-between items-center bg-rose-50 border border-rose-300 p-2.5 rounded-lg text-rose-900">
              <div>
                <span className="font-black text-xs block">NEW NET TOTAL DUE:</span>
                <span className="text-[10px] text-rose-700 font-semibold">(Auto added to Customer Ledger)</span>
              </div>
              <span className="text-base font-black">৳{newNetDue} TK</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Checkout & Print Button */}
          <button
            onClick={handleCheckout}
            disabled={isSubmitting || cart.length === 0 || !selectedCustomer}
            className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wide text-white shadow-lg transition flex items-center justify-center gap-2 ${
              cart.length === 0 || !selectedCustomer
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-700/20 active:scale-[0.99]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Print Invoice (৳{currentBill})</span>
          </button>
        </div>

      </div>

    </div>
  );
};
