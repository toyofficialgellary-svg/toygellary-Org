import React, { useState, useEffect, useMemo } from 'react';
import { 
  db, 
  Shop, 
  Customer,
  DailyAccount, 
  BANGLADESH_BANKS, 
  MFS_PROVIDERS,
  ALL_BANKS_AND_MFS,
  exportToCsvWithBom 
} from '../db/db';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  PlusCircle, 
  Download, 
  Search, 
  Building, 
  CreditCard, 
  Receipt,
  Pencil,
  Trash2,
  X,
  Users,
  Landmark,
  Plus,
  CheckCircle2,
  Phone,
  Banknote,
  PiggyBank
} from 'lucide-react';

interface DailyAccountsProps {
  shops: Shop[];
  activeShop: Shop;
  languageMode: 'EN' | 'BN' | 'BOTH';
  onRefresh: () => void;
}

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Shop Rent (দোকান ভাড়া)",
  "Transport / Rickshaw / Coolie (পরিবহন ও কুলি)",
  "Labour / Loading-Unloading (লেবার খরচ)",
  "Electricity / Utility (বিদ্যুৎ বিল)",
  "Staff Food & Refreshment (নাস্তা ও আপ্যায়ন)",
  "Packing Supplies & Tape (প্যাকিং ও টেপ)",
  "Market Association Fee (মার্কেট সমিতি)",
  "Repair & Maintenance (মেরামত)",
  "Stationery & Printing (স্টেশনারি)",
  "Tea & Snacks (চা-নাস্তা)",
  "Cleaning & Sanitation (পরিচ্ছন্নতা)",
  "Purchase Payment (মহাজন পেমেন্ট)",
  "Supplier Due Payment (বাকি পরিশোধ)",
  "Miscellaneous (অন্যান্য খরচ)"
];

export const INCOME_SOURCES = [
  "Carton Box / Waste Paper Sale (কার্টুন / ভাঙারি বিক্রি)",
  "Transport & Delivery Charge (ডেলিভারি চার্জ আদায়)",
  "Supplier Commission / Incentive (কমিশন)",
  "Scrap / Packaging Material (প্যাকিং সরঞ্জাম বিক্রি)",
  "Store Rent / Sub-lease (উপ-ভাড়া)",
  "General Misc Cash Income (অন্যান্য নগদ আয়)"
];

export function DailyAccounts({
  shops,
  activeShop,
  languageMode,
  onRefresh
}: DailyAccountsProps) {
  // 4 Tabs: 1. Expense, 2. Cash Income, 3. Customer Local (Cash & Bank), 4. Daily Bank Collections (All)
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'CASH_INCOME' | 'LOCAL_COLLECTIONS' | 'BANK_COLLECTIONS'>('EXPENSE');
  
  const [selectedShopFilter, setSelectedShopFilter] = useState<number>(0); // 0 = All Shops
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'>('TODAY');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data state
  const [entries, setEntries] = useState<DailyAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('toy_gallery_custom_expense_cats');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal Visibility States
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showNewCatInput, setShowNewCatInput] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');

  // Form State: Tab 1 (Expense)
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [expShopId, setExpShopId] = useState<number>(activeShop.id || 0);
  const [expCategory, setExpCategory] = useState<string>(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expPaymentMethod, setExpPaymentMethod] = useState<'CASH' | 'BANK' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY'>('CASH');
  const [expBankName, setExpBankName] = useState<string>(BANGLADESH_BANKS[0]);
  const [expTrxId, setExpTrxId] = useState<string>('');
  const [expNotes, setExpNotes] = useState<string>('');
  const [expRecordedBy, setExpRecordedBy] = useState<string>('Farhad Hossain');

  // Form State: Tab 2 (Cash Income)
  const [incDate, setIncDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [incShopId, setIncShopId] = useState<number>(activeShop.id || 0);
  const [incSource, setIncSource] = useState<string>(INCOME_SOURCES[0]);
  const [incAmount, setIncAmount] = useState<number | ''>('');
  const [incNotes, setIncNotes] = useState<string>('');
  const [incRecordedBy, setIncRecordedBy] = useState<string>('Staff');

  // Form State: Tab 3 (Local Customer Collections)
  const [locDate, setLocDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [locShopId, setLocShopId] = useState<number>(activeShop.id || 0);
  const [locCustomerId, setLocCustomerId] = useState<number>(0);
  const [locOption, setLocOption] = useState<'CASH' | 'BANK'>('CASH');
  const [locBankName, setLocBankName] = useState<string>(BANGLADESH_BANKS[0]);
  const [locTrxId, setLocTrxId] = useState<string>('');
  const [locAmount, setLocAmount] = useState<number | ''>('');
  const [locNotes, setLocNotes] = useState<string>('');
  const [locRecordedBy, setLocRecordedBy] = useState<string>('Khorshed Alam');

  // Form State: Tab 4 (Bank Collections - All Customers)
  const [bnkDate, setBnkDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bnkShopId, setBnkShopId] = useState<number>(activeShop.id || 0);
  const [bnkCustomerId, setBnkCustomerId] = useState<number>(0);
  const [bnkBankName, setBnkBankName] = useState<string>(BANGLADESH_BANKS[0]);
  const [bnkBranchName, setBnkBranchName] = useState<string>('');
  const [bnkTrxId, setBnkTrxId] = useState<string>('');
  const [bnkAmount, setBnkAmount] = useState<number | ''>('');
  const [bnkNotes, setBnkNotes] = useState<string>('');
  const [bnkRecordedBy, setBnkRecordedBy] = useState<string>('Farhad Hossain');

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState<DailyAccount | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editShopId, setEditShopId] = useState<number>(activeShop.id || 0);
  const [editCategoryOrSource, setEditCategoryOrSource] = useState<string>('');
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'CASH' | 'BANK' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY'>('CASH');
  const [editBankName, setEditBankName] = useState<string>(BANGLADESH_BANKS[0]);
  const [editBranchName, setEditBranchName] = useState<string>('');
  const [editTrxId, setEditTrxId] = useState<string>('');
  const [editCustomerId, setEditCustomerId] = useState<number>(0);
  const [editPartyName, setEditPartyName] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editRecordedBy, setEditRecordedBy] = useState<string>('Staff');

  // Load entries and customers from Dexie
  const loadData = async () => {
    const allAccounts = await db.dailyAccounts.toArray();
    allAccounts.sort((a, b) => b.date - a.date);
    setEntries(allAccounts);

    const allCusts = await db.customers.toArray();
    setCustomers(allCusts);

    if (allCusts.length > 0) {
      const localCust = allCusts.find(c => c.customerType === 'LOCAL');
      if (localCust && !locCustomerId) setLocCustomerId(localCust.id!);
      if (!bnkCustomerId) setBnkCustomerId(allCusts[0].id!);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync activeShop change
  useEffect(() => {
    if (activeShop.id) {
      setExpShopId(activeShop.id);
      setIncShopId(activeShop.id);
      setLocShopId(activeShop.id);
      setBnkShopId(activeShop.id);
    }
  }, [activeShop]);

  // Combined Category List
  const allExpenseCategories = useMemo(() => {
    return [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories];
  }, [customCategories]);

  const handleAddNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (!allExpenseCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      localStorage.setItem('toy_gallery_custom_expense_cats', JSON.stringify(updated));
    }
    setExpCategory(trimmed);
    setNewCatName('');
    setShowNewCatInput(false);
  };

  // Filter entries based on active tab, date, shop, search
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - (now.getDay() * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return entries.filter(e => {
      // 1. Tab Filter
      if (activeTab === 'EXPENSE' && e.type !== 'EXPENSE') return false;
      if (activeTab === 'CASH_INCOME' && e.type !== 'INCOME') return false;
      if (activeTab === 'LOCAL_COLLECTIONS') {
        if (e.type !== 'CASH_COLLECTION' && !(e.type === 'BANK_MFS_COLLECTION' && e.customerType === 'LOCAL')) {
          // Backward compatibility check
          if (!e.customerType && e.type === 'CASH_COLLECTION') return true;
          return false;
        }
      }
      if (activeTab === 'BANK_COLLECTIONS') {
        if (e.type !== 'BANK_MFS_COLLECTION' && e.paymentChannel === 'CASH') return false;
        if (e.type !== 'BANK_MFS_COLLECTION' && e.paymentChannel !== 'BANK') return false;
      }

      // 2. Shop Filter
      if (selectedShopFilter > 0 && e.shopId !== selectedShopFilter) return false;

      // 3. Date Filter
      if (dateFilter === 'TODAY' && e.date < todayStart) return false;
      if (dateFilter === 'YESTERDAY' && (e.date < yesterdayStart || e.date >= todayStart)) return false;
      if (dateFilter === 'THIS_WEEK' && e.date < weekStart) return false;
      if (dateFilter === 'THIS_MONTH' && e.date < monthStart) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = (e.category || '').toLowerCase();
        const party = (e.partyName || '').toLowerCase();
        const note = (e.notes || '').toLowerCase();
        const bank = (e.bankName || '').toLowerCase();
        const trx = (e.transactionId || '').toLowerCase();
        const branch = (e.branchName || '').toLowerCase();
        if (!cat.includes(q) && !party.includes(q) && !note.includes(q) && !bank.includes(q) && !trx.includes(q) && !branch.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [entries, activeTab, selectedShopFilter, dateFilter, searchQuery]);

  // Tab Totals Calculation
  const tabTotals = useMemo(() => {
    let totalAmount = 0;
    let cashSubtotal = 0;
    let bankSubtotal = 0;

    filteredEntries.forEach(e => {
      totalAmount += (e.amount || 0);
      if (e.paymentChannel === 'CASH') {
        cashSubtotal += (e.amount || 0);
      } else {
        bankSubtotal += (e.amount || 0);
      }
    });

    return { totalAmount, cashSubtotal, bankSubtotal, count: filteredEntries.length };
  }, [filteredEntries]);

  // Bank-wise Breakdown for Tab 4 (Daily Bank Collections)
  const bankWiseReport = useMemo(() => {
    if (activeTab !== 'BANK_COLLECTIONS') return [];
    const map: { [key: string]: { bankName: string; totalAmount: number; count: number } } = {};

    filteredEntries.forEach(e => {
      const bName = e.bankName || e.paymentChannel || 'Other Bank';
      if (!map[bName]) {
        map[bName] = { bankName: bName, totalAmount: 0, count: 0 };
      }
      map[bName].totalAmount += (e.amount || 0);
      map[bName].count += 1;
    });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredEntries, activeTab]);

  // Helper to persist & sync
  const syncAccountsToLocalStorage = async () => {
    const all = await db.dailyAccounts.toArray();
    localStorage.setItem('toy_gallery_daily_accounts', JSON.stringify(all));
  };

  // --- SAVE HANDLERS ---

  // 1. Save Tab 1: Daily Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const shop = shops.find(s => s.id === expShopId) || activeShop;
    const dateTimestamp = new Date(expDate).getTime() + (new Date().getHours() * 3600000) + (new Date().getMinutes() * 60000);

    await db.dailyAccounts.add({
      shopId: shop.id!,
      shopName: shop.name,
      date: dateTimestamp,
      type: 'EXPENSE',
      category: expCategory,
      amount: amt,
      paymentChannel: expPaymentMethod,
      bankName: (expPaymentMethod === 'BANK' || expPaymentMethod === 'BKASH' || expPaymentMethod === 'NAGAD' || expPaymentMethod === 'ROCKET' || expPaymentMethod === 'UPAY') ? expBankName : undefined,
      transactionId: expTrxId.trim() || undefined,
      notes: expNotes.trim() || undefined,
      recordedBy: expRecordedBy.trim() || 'Staff'
    });

    await syncAccountsToLocalStorage();
    setExpAmount('');
    setExpTrxId('');
    setExpNotes('');
    setShowAddModal(false);
    await loadData();
    onRefresh();
  };

  // 2. Save Tab 2: Daily Cash Income
  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(incAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid income amount.');
      return;
    }

    const shop = shops.find(s => s.id === incShopId) || activeShop;
    const dateTimestamp = new Date(incDate).getTime() + (new Date().getHours() * 3600000) + (new Date().getMinutes() * 60000);

    await db.dailyAccounts.add({
      shopId: shop.id!,
      shopName: shop.name,
      date: dateTimestamp,
      type: 'INCOME',
      category: incSource,
      amount: amt,
      paymentChannel: 'CASH',
      notes: incNotes.trim() || undefined,
      recordedBy: incRecordedBy.trim() || 'Staff'
    });

    await syncAccountsToLocalStorage();
    setIncAmount('');
    setIncNotes('');
    setShowAddModal(false);
    await loadData();
    onRefresh();
  };

  // 3. Save Tab 3: Customer Local Collections
  const handleSaveLocalCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(locAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid collection amount.');
      return;
    }
    const customer = customers.find(c => c.id === Number(locCustomerId));
    if (!customer) {
      alert('Please select a local customer.');
      return;
    }

    const shop = shops.find(s => s.id === locShopId) || activeShop;
    const dateTimestamp = new Date(locDate).getTime() + (new Date().getHours() * 3600000) + (new Date().getMinutes() * 60000);
    const isCash = locOption === 'CASH';

    // Update customer due and ledger
    const newDue = Math.max(0, customer.currentDue - amt);
    await db.customers.update(customer.id!, { currentDue: newDue });

    const ref = isCash 
      ? `Local Collection (Cash)` 
      : `Local Collection (${locBankName})${locTrxId ? ' Trx:' + locTrxId : ''}`;

    await db.customerLedger.add({
      customerId: customer.id!,
      date: dateTimestamp,
      type: 'PAYMENT',
      reference: ref,
      debit: 0,
      credit: amt,
      balance: newDue,
      notes: locNotes || `Collected at ${shop.name}`
    });

    // Add Daily Account entry
    await db.dailyAccounts.add({
      shopId: shop.id!,
      shopName: shop.name,
      date: dateTimestamp,
      type: isCash ? 'CASH_COLLECTION' : 'BANK_MFS_COLLECTION',
      category: isCash ? 'Local Customer Cash Collection' : 'Local Customer Bank Collection',
      amount: amt,
      paymentChannel: isCash ? 'CASH' : (MFS_PROVIDERS.includes(locBankName) ? (locBankName.toUpperCase().includes('BKASH') ? 'BKASH' : 'NAGAD') : 'BANK'),
      bankName: !isCash ? locBankName : undefined,
      transactionId: !isCash && locTrxId.trim() ? locTrxId.trim() : undefined,
      partyName: customer.name,
      customerId: customer.id,
      customerType: 'LOCAL',
      notes: locNotes.trim() || undefined,
      recordedBy: locRecordedBy.trim() || 'Staff'
    });

    await syncAccountsToLocalStorage();
    setLocAmount('');
    setLocTrxId('');
    setLocNotes('');
    setShowAddModal(false);
    await loadData();
    onRefresh();
  };

  // 4. Save Tab 4: Bank Collections (All Customers)
  const handleSaveBankCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(bnkAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid bank collection amount.');
      return;
    }
    const customer = customers.find(c => c.id === Number(bnkCustomerId));
    if (!customer) {
      alert('Please select a customer.');
      return;
    }

    const shop = shops.find(s => s.id === bnkShopId) || activeShop;
    const dateTimestamp = new Date(bnkDate).getTime() + (new Date().getHours() * 3600000) + (new Date().getMinutes() * 60000);

    // Update customer due and ledger
    const newDue = Math.max(0, customer.currentDue - amt);
    await db.customers.update(customer.id!, { currentDue: newDue });

    const ref = `Bank Collection (${bnkBankName}${bnkBranchName ? ' - ' + bnkBranchName : ''})${bnkTrxId ? ' Trx/Cheque:' + bnkTrxId : ''}`;

    await db.customerLedger.add({
      customerId: customer.id!,
      date: dateTimestamp,
      type: 'PAYMENT',
      reference: ref,
      debit: 0,
      credit: amt,
      balance: newDue,
      notes: bnkNotes || `Direct Bank Deposit / Transfer`
    });

    // Add Daily Account entry
    await db.dailyAccounts.add({
      shopId: shop.id!,
      shopName: shop.name,
      date: dateTimestamp,
      type: 'BANK_MFS_COLLECTION',
      category: `Bank Collection (${customer.customerType === 'LOCAL' ? 'Local' : 'Outside'})`,
      amount: amt,
      paymentChannel: MFS_PROVIDERS.includes(bnkBankName) ? (bnkBankName.toUpperCase().includes('BKASH') ? 'BKASH' : 'NAGAD') : 'BANK',
      bankName: bnkBankName,
      branchName: bnkBranchName.trim() || undefined,
      transactionId: bnkTrxId.trim() || undefined,
      partyName: customer.name,
      customerId: customer.id,
      customerType: customer.customerType,
      notes: bnkNotes.trim() || undefined,
      recordedBy: bnkRecordedBy.trim() || 'Staff'
    });

    await syncAccountsToLocalStorage();
    setBnkAmount('');
    setBnkBranchName('');
    setBnkTrxId('');
    setBnkNotes('');
    setShowAddModal(false);
    await loadData();
    onRefresh();
  };

  // --- EDIT & DELETE HANDLERS ---

  const handleOpenEdit = (entry: DailyAccount) => {
    setEditingEntry(entry);
    setEditDate(new Date(entry.date).toISOString().slice(0, 10));
    setEditShopId(entry.shopId);
    setEditCategoryOrSource(entry.category || '');
    setEditAmount(entry.amount || '');
    setEditPaymentMethod(entry.paymentChannel || 'CASH');
    setEditBankName(entry.bankName || BANGLADESH_BANKS[0]);
    setEditBranchName(entry.branchName || '');
    setEditTrxId(entry.transactionId || '');
    setEditCustomerId(entry.customerId || 0);
    setEditPartyName(entry.partyName || '');
    setEditNotes(entry.notes || '');
    setEditRecordedBy(entry.recordedBy || 'Staff');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !editingEntry.id) return;
    const amt = Number(editAmount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const shop = shops.find(s => s.id === editShopId) || activeShop;
    const dateTimestamp = new Date(editDate).getTime() + (new Date().getHours() * 3600000) + (new Date().getMinutes() * 60000);

    await db.dailyAccounts.update(editingEntry.id, {
      shopId: shop.id!,
      shopName: shop.name,
      date: dateTimestamp,
      category: editCategoryOrSource.trim(),
      amount: amt,
      paymentChannel: editPaymentMethod,
      bankName: editPaymentMethod !== 'CASH' ? editBankName : undefined,
      branchName: editBranchName.trim() || undefined,
      transactionId: editTrxId.trim() || undefined,
      partyName: editPartyName.trim() || undefined,
      notes: editNotes.trim() || undefined,
      recordedBy: editRecordedBy.trim() || 'Staff'
    });

    await syncAccountsToLocalStorage();
    setEditingEntry(null);
    await loadData();
    onRefresh();
  };

  const handleDelete = async (entry: DailyAccount) => {
    if (!entry.id) return;
    const isSure = window.confirm(
      `Are you sure you want to delete this record (${entry.category || entry.type}) of ৳${entry.amount.toLocaleString()} TK?\nআপনি কি নিশ্চিত এই হিসাব এন্ট্রি ডিলিট করতে চান?`
    );
    if (!isSure) return;

    await db.dailyAccounts.delete(entry.id);
    await syncAccountsToLocalStorage();
    await loadData();
    onRefresh();
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportCsv = () => {
    let csv = `Date,Shop,Type,Category / Source,Amount (TK),Payment Channel,Bank / MFS,Branch,Trx / Cheque No,Party / Customer,Customer Type,Notes,Recorded By\n`;
    filteredEntries.forEach(e => {
      const dateStr = new Date(e.date).toLocaleString('en-GB');
      csv += `"${dateStr}","${e.shopName}","${e.type}","${(e.category || '').replace(/"/g, '""')}","${e.amount}","${e.paymentChannel}","${e.bankName || ''}","${e.branchName || ''}","${e.transactionId || ''}","${(e.partyName || '').replace(/"/g, '""')}","${e.customerType || ''}","${(e.notes || '').replace(/"/g, '""')}","${e.recordedBy}"\n`;
    });

    const filename = `Toy_Gallery_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportToCsvWithBom(filename, csv);
  };

  const localCustomers = useMemo(() => {
    return customers.filter(c => c.customerType === 'LOCAL');
  }, [customers]);

  return (
    <div className="space-y-4">
      {/* Header with Title & Main Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            Daily Accounts & Financial Ledger
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              4 Modules
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage daily business expenses, cash income, local customer collections, and bank deposits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            {activeTab === 'EXPENSE' && '+ Add Expense'}
            {activeTab === 'CASH_INCOME' && '+ Add Cash Income'}
            {activeTab === 'LOCAL_COLLECTIONS' && '+ Add Local Collection'}
            {activeTab === 'BANK_COLLECTIONS' && '+ Add Bank Collection'}
          </button>
        </div>
      </div>

      {/* 4 Tabs Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <button
          onClick={() => { setActiveTab('EXPENSE'); setShowAddModal(false); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'EXPENSE'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          Tab 1: Daily Expense
        </button>

        <button
          onClick={() => { setActiveTab('CASH_INCOME'); setShowAddModal(false); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'CASH_INCOME'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
          }`}
        >
          <Banknote className="w-4 h-4" />
          Tab 2: Daily Cash Income
        </button>

        <button
          onClick={() => { setActiveTab('LOCAL_COLLECTIONS'); setShowAddModal(false); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'LOCAL_COLLECTIONS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Tab 3: Customer Local (Cash & Bank)
        </button>

        <button
          onClick={() => { setActiveTab('BANK_COLLECTIONS'); setShowAddModal(false); }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
            activeTab === 'BANK_COLLECTIONS'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Tab 4: Daily Bank Collections
        </button>
      </div>

      {/* Summary Stat Card for the Active Tab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {activeTab === 'EXPENSE' && 'Total Filtered Expense'}
              {activeTab === 'CASH_INCOME' && 'Total Filtered Cash Income'}
              {activeTab === 'LOCAL_COLLECTIONS' && 'Total Local Collections'}
              {activeTab === 'BANK_COLLECTIONS' && 'Total Bank Collections'}
            </p>
            <p className={`text-2xl font-bold mt-1 ${
              activeTab === 'EXPENSE' ? 'text-red-600' :
              activeTab === 'CASH_INCOME' ? 'text-emerald-600' :
              activeTab === 'LOCAL_COLLECTIONS' ? 'text-blue-600' : 'text-purple-600'
            }`}>
              ৳{tabTotals.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${
            activeTab === 'EXPENSE' ? 'bg-red-50 text-red-600' :
            activeTab === 'CASH_INCOME' ? 'bg-emerald-50 text-emerald-600' :
            activeTab === 'LOCAL_COLLECTIONS' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
          }`}>
            {activeTab === 'EXPENSE' && <ArrowDownCircle className="w-6 h-6" />}
            {activeTab === 'CASH_INCOME' && <PiggyBank className="w-6 h-6" />}
            {activeTab === 'LOCAL_COLLECTIONS' && <Users className="w-6 h-6" />}
            {activeTab === 'BANK_COLLECTIONS' && <Landmark className="w-6 h-6" />}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {activeTab === 'EXPENSE' ? 'Cash Paid Expense' : 'Cash Channel Subtotal'}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ৳{tabTotals.cashSubtotal.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {activeTab === 'EXPENSE' ? 'Bank / MFS Expense' : 'Bank / MFS Subtotal'}
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              ৳{tabTotals.bankSubtotal.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Date, Shop, Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto text-xs">
          <span className="font-bold text-slate-500 mr-1">Date:</span>
          {(['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'ALL'] as const).map(df => (
            <button
              key={df}
              onClick={() => setDateFilter(df)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                dateFilter === df
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {df === 'TODAY' && 'Today'}
              {df === 'YESTERDAY' && 'Yesterday'}
              {df === 'THIS_WEEK' && 'This Week'}
              {df === 'THIS_MONTH' && 'This Month'}
              {df === 'ALL' && 'All Records'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Shop Selector */}
          <select
            value={selectedShopFilter}
            onChange={(e) => setSelectedShopFilter(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
          >
            <option value={0}>All Outlets / Godown</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search record..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Table for the Active Tab */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                {activeTab === 'EXPENSE' && <th className="py-3 px-3">Category</th>}
                {activeTab === 'CASH_INCOME' && <th className="py-3 px-3">Source / Type</th>}
                {activeTab === 'LOCAL_COLLECTIONS' && <th className="py-3 px-3">Local Customer</th>}
                {activeTab === 'BANK_COLLECTIONS' && <th className="py-3 px-3">Customer (All)</th>}
                <th className="py-3 px-3 text-right">Amount (৳)</th>
                <th className="py-3 px-3">Payment Method</th>
                {activeTab === 'BANK_COLLECTIONS' && <th className="py-3 px-3">Bank & Branch</th>}
                {(activeTab === 'LOCAL_COLLECTIONS' || activeTab === 'BANK_COLLECTIONS' || activeTab === 'EXPENSE') && (
                  <th className="py-3 px-3">Trx ID / Cheque</th>
                )}
                <th className="py-3 px-3">Outlet / Shop</th>
                <th className="py-3 px-3">Notes</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-sm">No records found for this filter</p>
                    <p className="text-xs mt-1">Click "+ Add" to record a new transaction</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-900">
                      {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Category or Customer */}
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {activeTab === 'EXPENSE' && (
                        <span className="text-red-700 font-bold">{entry.category}</span>
                      )}
                      {activeTab === 'CASH_INCOME' && (
                        <span className="text-emerald-700 font-bold">{entry.category}</span>
                      )}
                      {activeTab === 'LOCAL_COLLECTIONS' && (
                        <div>
                          <p className="font-bold text-slate-900">{entry.partyName || 'Local Customer'}</p>
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200 font-semibold">
                            Local Customer
                          </span>
                        </div>
                      )}
                      {activeTab === 'BANK_COLLECTIONS' && (
                        <div>
                          <p className="font-bold text-slate-900">{entry.partyName || 'Customer'}</p>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${
                            entry.customerType === 'OUTSIDE' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {entry.customerType === 'OUTSIDE' ? 'Outside Buyer' : 'Local Wholesale'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap">
                      <span className={`text-sm ${
                        activeTab === 'EXPENSE' ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        ৳{entry.amount.toLocaleString()}
                      </span>
                    </td>

                    {/* Payment Method Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        entry.paymentChannel === 'CASH'
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.paymentChannel === 'BANK'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {entry.paymentChannel === 'CASH' ? '💵 Cash' : entry.paymentChannel === 'BANK' ? '🏦 Bank' : `📱 ${entry.paymentChannel}`}
                      </span>
                      {entry.bankName && entry.paymentChannel !== 'CASH' && activeTab !== 'BANK_COLLECTIONS' && (
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{entry.bankName}</p>
                      )}
                    </td>

                    {/* Bank & Branch (for Bank Collections Tab) */}
                    {activeTab === 'BANK_COLLECTIONS' && (
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-slate-900">{entry.bankName || 'Direct Bank'}</p>
                        {entry.branchName && (
                          <p className="text-[10px] text-slate-500">Branch: {entry.branchName}</p>
                        )}
                      </td>
                    )}

                    {/* Trx ID */}
                    {(activeTab === 'LOCAL_COLLECTIONS' || activeTab === 'BANK_COLLECTIONS' || activeTab === 'EXPENSE') && (
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {entry.transactionId ? (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {entry.transactionId}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    )}

                    {/* Outlet / Shop */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                      {entry.shopName}
                    </td>

                    {/* Notes */}
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                      {entry.notes || '-'}
                    </td>

                    {/* Edit & Delete Action Buttons */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(entry)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                          title="Edit Record"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                  <td className="py-3 px-3">Total ({filteredEntries.length} Items)</td>
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 text-right text-sm">
                    ৳{tabTotals.totalAmount.toLocaleString()}
                  </td>
                  <td colSpan={7} className="py-3 px-3 text-slate-500 font-normal">
                    Cash: ৳{tabTotals.cashSubtotal.toLocaleString()} | Bank/MFS: ৳{tabTotals.bankSubtotal.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Tab 4: Bank-Wise Total Report at Bottom (Specified in Prompt!) */}
      {activeTab === 'BANK_COLLECTIONS' && bankWiseReport.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-purple-600" />
              Bank-Wise Collection Total Report
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Grand Total: <strong className="text-purple-700">৳{tabTotals.totalAmount.toLocaleString()}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {bankWiseReport.map(b => (
              <div key={b.bankName} className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-900">{b.bankName}</p>
                  <p className="text-[11px] text-slate-500">{b.count} collection{b.count > 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-purple-700">৳{b.totalAmount.toLocaleString()}</span>
                  <p className="text-[10px] text-slate-400">
                    {tabTotals.totalAmount > 0 ? ((b.totalAmount / tabTotals.totalAmount) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD TRANSACTION MODAL (Dynamic according to Active Tab)   */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {activeTab === 'EXPENSE' && <ArrowDownCircle className="w-5 h-5 text-red-600" />}
                {activeTab === 'CASH_INCOME' && <Banknote className="w-5 h-5 text-emerald-600" />}
                {activeTab === 'LOCAL_COLLECTIONS' && <Users className="w-5 h-5 text-blue-600" />}
                {activeTab === 'BANK_COLLECTIONS' && <Landmark className="w-5 h-5 text-purple-600" />}
                {activeTab === 'EXPENSE' && 'Record Daily Expense'}
                {activeTab === 'CASH_INCOME' && 'Record Daily Cash Income'}
                {activeTab === 'LOCAL_COLLECTIONS' && 'Customer Local Collection (Cash & Bank)'}
                {activeTab === 'BANK_COLLECTIONS' && 'Record Daily Bank Collection (All Customers)'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB 1: ADD EXPENSE FORM */}
            {activeTab === 'EXPENSE' && (
              <form onSubmit={handleSaveExpense} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Outlet / Shop</label>
                    <select
                      value={expShopId}
                      onChange={(e) => setExpShopId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      {shops.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Category with Add New Category Option */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Expense Category</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCatInput(!showNewCatInput)}
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {showNewCatInput ? 'Select Existing' : '+ Add New Category'}
                    </button>
                  </div>

                  {showNewCatInput ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter new category name (e.g. Generator Fuel)"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewCategory}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      {allExpenseCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (৳ TK)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-red-600"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['CASH', 'BANK', 'BKASH', 'NAGAD', 'ROCKET', 'UPAY'] as const).map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setExpPaymentMethod(method)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                          expPaymentMethod === method
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* If Bank or MFS: show details */}
                {expPaymentMethod === 'BANK' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <select
                      value={expBankName}
                      onChange={(e) => setExpBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    >
                      {BANGLADESH_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}

                {expPaymentMethod !== 'CASH' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transaction ID / Cheque No</label>
                    <input
                      type="text"
                      placeholder="e.g. TRX-992140"
                      value={expTrxId}
                      onChange={(e) => setExpTrxId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Note / Description</label>
                  <textarea
                    rows={2}
                    placeholder="Expense details or supplier name..."
                    value={expNotes}
                    onChange={(e) => setExpNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ADD CASH INCOME FORM */}
            {activeTab === 'CASH_INCOME' && (
              <form onSubmit={handleSaveIncome} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={incDate}
                      onChange={(e) => setIncDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Outlet / Shop</label>
                    <select
                      value={incShopId}
                      onChange={(e) => setIncShopId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      {shops.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Income Source / Category</label>
                  <select
                    value={incSource}
                    onChange={(e) => setIncSource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    {INCOME_SOURCES.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (৳ TK)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 1500"
                    value={incAmount}
                    onChange={(e) => setIncAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-emerald-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Note / Details</label>
                  <textarea
                    rows={2}
                    placeholder="Income details or buyer reference..."
                    value={incNotes}
                    onChange={(e) => setIncNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Save Cash Income
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: ADD LOCAL CUSTOMER COLLECTION (Cash & Bank options) */}
            {activeTab === 'LOCAL_COLLECTIONS' && (
              <form onSubmit={handleSaveLocalCollection} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={locDate}
                      onChange={(e) => setLocDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Outlet / Shop</label>
                    <select
                      value={locShopId}
                      onChange={(e) => setLocShopId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      {shops.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Select Customer (Local only) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Customer (Local Only)</label>
                  <select
                    value={locCustomerId}
                    onChange={(e) => setLocCustomerId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    required
                  >
                    {localCustomers.length === 0 ? (
                      <option value={0}>No Local Customers Found</option>
                    ) : (
                      localCustomers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone}) - Due: ৳{c.currentDue.toLocaleString()}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Radio Buttons: Cash Collection & Bank Collection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Collection Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      locOption === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="locOption"
                        checked={locOption === 'CASH'}
                        onChange={() => setLocOption('CASH')}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>💵 Cash Collection</span>
                    </label>

                    <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      locOption === 'BANK'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <input
                        type="radio"
                        name="locOption"
                        checked={locOption === 'BANK'}
                        onChange={() => setLocOption('BANK')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>🏦 Bank / MFS Collection</span>
                    </label>
                  </div>
                </div>

                {/* If Bank: show all Bangladeshi Banks + MFS dropdown */}
                {locOption === 'BANK' && (
                  <div className="space-y-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Bank / Mobile Banking (ALL Bangladeshi Banks)
                      </label>
                      <select
                        value={locBankName}
                        onChange={(e) => setLocBankName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                      >
                        <optgroup label="Bangladeshi Commercial & Islamic Banks">
                          {BANGLADESH_BANKS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Mobile Financial Services (MFS)">
                          {MFS_PROVIDERS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Transaction ID / Cheque No</label>
                      <input
                        type="text"
                        placeholder="e.g. DBBL-882319 / Cheque #1920"
                        value={locTrxId}
                        onChange={(e) => setLocTrxId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Collected Amount (৳ TK)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={locAmount}
                    onChange={(e) => setLocAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-blue-600"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Due clearance against invoice..."
                    value={locNotes}
                    onChange={(e) => setLocNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Save Local Collection
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: ADD BANK COLLECTION (All Customers) */}
            {activeTab === 'BANK_COLLECTIONS' && (
              <form onSubmit={handleSaveBankCollection} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={bnkDate}
                      onChange={(e) => setBnkDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Outlet / Shop</label>
                    <select
                      value={bnkShopId}
                      onChange={(e) => setBnkShopId(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      {shops.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Select Customer (All: Local + Outside) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Customer (All Local + Outside)</label>
                  <select
                    value={bnkCustomerId}
                    onChange={(e) => setBnkCustomerId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                    required
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        [{c.customerType}] {c.name} ({c.phone}) - Due: ৳{c.currentDue.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bank Name Dropdown (All Bangladeshi Banks) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name (All Bangladeshi Banks)
                  </label>
                  <select
                    value={bnkBankName}
                    onChange={(e) => setBnkBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                    required
                  >
                    <optgroup label="Bangladeshi Commercial & Islamic Banks">
                      {BANGLADESH_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Mobile Financial Services (MFS)">
                      {MFS_PROVIDERS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Branch Name & Trx / Cheque */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Anderkilla Branch"
                      value={bnkBranchName}
                      onChange={(e) => setBnkBranchName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Trx ID / Cheque No</label>
                    <input
                      type="text"
                      placeholder="e.g. CQ-991204"
                      value={bnkTrxId}
                      onChange={(e) => setBnkTrxId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Collected Amount (৳ TK)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 20000"
                    value={bnkAmount}
                    onChange={(e) => setBnkAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-purple-700"
                    required
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank transfer directly to company account"
                    value={bnkNotes}
                    onChange={(e) => setBnkNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Save Bank Collection
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT MODAL (Works for ALL 4 Modules & Synchronizes)        */}
      {/* ========================================================= */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Edit Transaction Record
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                  {editingEntry.type}
                </span>
              </h2>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Outlet / Shop</label>
                  <select
                    value={editShopId}
                    onChange={(e) => setEditShopId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category / Source */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category / Description / Source
                </label>
                <input
                  type="text"
                  value={editCategoryOrSource}
                  onChange={(e) => setEditCategoryOrSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  required
                />
              </div>

              {/* Party / Customer Name if present */}
              {editingEntry.partyName && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Party Name</label>
                  <input
                    type="text"
                    value={editPartyName}
                    onChange={(e) => setEditPartyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (৳ TK)</label>
                <input
                  type="number"
                  min="1"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  required
                />
              </div>

              {/* Payment Channel */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Channel</label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank</option>
                  <option value="BKASH">bKash</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="ROCKET">Rocket</option>
                  <option value="UPAY">Upay</option>
                </select>
              </div>

              {/* Bank & Branch if not Cash */}
              {editPaymentMethod !== 'CASH' && (
                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank / MFS Name</label>
                    <select
                      value={editBankName}
                      onChange={(e) => setEditBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                    >
                      <optgroup label="Bangladeshi Banks">
                        {BANGLADESH_BANKS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </optgroup>
                      <optgroup label="MFS Providers">
                        {MFS_PROVIDERS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                      <input
                        type="text"
                        value={editBranchName}
                        onChange={(e) => setEditBranchName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trx ID / Cheque No</label>
                      <input
                        type="text"
                        value={editTrxId}
                        onChange={(e) => setEditTrxId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
