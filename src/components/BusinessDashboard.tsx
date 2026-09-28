import React, { useState, useEffect } from 'react';
import { 
  db, 
  Shop, 
  Product, 
  Customer, 
  Company, 
  Invoice, 
  InvoiceItem, 
  DailyAccount, 
  SupplierLedger,
  Staff 
} from '../db/db';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  Wallet, 
  Users, 
  Building2, 
  CalendarCheck, 
  TrendingUp, 
  Receipt, 
  Store, 
  HardDrive, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink, 
  PlusCircle, 
  CheckCircle2, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  Boxes,
  Banknote,
  Smartphone
} from 'lucide-react';
import { ApkInstallModal } from './ApkInstallModal';

interface BusinessDashboardProps {
  shops: Shop[];
  activeShop?: Shop;
  products: Product[];
  customers: Customer[];
  companies: Company[];
  stocksMap: Record<number, number>;
  languageMode: 'EN' | 'BN' | 'BOTH';
  currentUserRole: 'SUPER_ADMIN' | 'MANAGER' | 'SALESMAN';
  onNavigateTab: (tab: any) => void;
  onOpenDashboardUrl?: () => void;
}

export function BusinessDashboard({
  shops,
  activeShop,
  products,
  customers,
  companies,
  stocksMap,
  languageMode,
  currentUserRole,
  onNavigateTab,
  onOpenDashboardUrl
}: BusinessDashboardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyAccount[]>([]);
  const [supplierDuesMap, setSupplierDuesMap] = useState<Record<number, number>>({});
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [showApkModal, setShowApkModal] = useState<boolean>(false);

  useEffect(() => {
    const loadDashboardMetrics = async () => {
      const invs = await db.invoices.toArray();
      const items = await db.invoiceItems.toArray();
      const accounts = await db.dailyAccounts.toArray();
      const staff = await db.staff.toArray();

      setInvoices(invs.sort((a, b) => b.date - a.date));
      setInvoiceItems(items);
      setDailyExpenses(accounts);
      setStaffList(staff);

      // Supplier dues map
      const sdues: Record<number, number> = {};
      for (const comp of companies) {
        if (comp.id) {
          const last = await db.supplierLedger.where('companyId').equals(comp.id).last();
          sdues[comp.id] = last ? last.balance : 0;
        }
      }
      setSupplierDuesMap(sdues);
    };

    loadDashboardMetrics();
  }, [companies]);

  // Today's metrics
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayInvoices = invoices.filter(i => i.date >= todayStart);
  const todaySales = todayInvoices.reduce((sum, i) => sum + i.currentBill, 0);
  const todayPaid = todayInvoices.reduce((sum, i) => sum + i.paidNow, 0);

  // Financial totals
  const totalSales = invoices.reduce((sum, i) => sum + i.currentBill, 0);
  const totalCustomerDues = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const totalSupplierDues = Object.values(supplierDuesMap).reduce((sum, d) => sum + d, 0);

  // Cash in drawer calculation
  const totalCashInflow = dailyExpenses
    .filter(e => (e.type === 'CASH_COLLECTION' || e.type === 'INCOME') && e.paymentChannel === 'CASH')
    .reduce((sum, e) => sum + e.amount, 0) + todayPaid;

  const totalCashOutflow = dailyExpenses
    .filter(e => e.type === 'EXPENSE' && e.paymentChannel === 'CASH')
    .reduce((sum, e) => sum + e.amount, 0);

  const netCashInDrawer = totalCashInflow - totalCashOutflow;

  // Inventory valuation
  let totalStockValuationCost = 0;
  let totalStockValuationSale = 0;
  products.forEach(p => {
    shops.forEach(s => {
      const pcs = stocksMap[p.id!] || 0;
      totalStockValuationCost += pcs * p.purchasePricePc;
      totalStockValuationSale += pcs * p.sellingPricePc;
    });
  });

  // Low stock items
  const lowStockItems = products.filter(p => {
    const totalPcs = stocksMap[p.id!] || 0;
    const cartons = p.pcsPerCarton > 0 ? Math.floor(totalPcs / p.pcsPerCarton) : 0;
    return cartons <= p.lowStockThresholdCartons;
  });

  // Modules catalog definition
  const modules = [
    {
      id: 'POS',
      title: 'POS Billing Counter',
      titleBn: 'বিক্রয় ও ক্যাশ মেমো',
      desc: 'Carton & loose piece billing, customer search, running due, instant receipt print.',
      icon: ShoppingCart,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badge: `${todayInvoices.length} Bills Today`,
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      actionText: 'Open POS Billing'
    },
    {
      id: 'PRODUCTS',
      title: 'Product Master & Stocks',
      titleBn: 'পণ্য ও স্টক তালিকা',
      desc: 'SKU, English & Bengali names, carton conversions, purchase & wholesale prices.',
      icon: Package,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      badge: `${products.length} Products`,
      badgeColor: 'bg-amber-500/20 text-amber-300',
      actionText: 'Manage Inventory'
    },
    {
      id: 'PURCHASES',
      title: 'Purchase & Supplier Inward',
      titleBn: 'স্টক ইনওয়ার্ড ও মহাজন বিল',
      desc: 'Consignments from Dhaka/Ctg manufacturers, carton stock-in, purchase returns.',
      icon: Truck,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      badge: `${companies.length} Suppliers`,
      badgeColor: 'bg-blue-500/20 text-blue-300',
      actionText: 'Inward Consignment'
    },
    {
      id: 'ACCOUNTS',
      title: 'Daily Accounts & Cashbook',
      titleBn: 'দৈনিক ক্যাশবুক ও খরচ',
      desc: 'Expense categories (food, rent, coolie, utility), cash/bank/MFS collections.',
      icon: Wallet,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      badge: `${dailyExpenses.length} Entries`,
      badgeColor: 'bg-purple-500/20 text-purple-300',
      actionText: 'Record Accounts'
    },
    {
      id: 'CUSTOMERS',
      title: 'Customer Ledger & Dues',
      titleBn: 'কাস্টমার বাকি খতিয়ান',
      desc: 'Local (Chittagong) & outside district customers with running due statements.',
      icon: Users,
      color: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      badge: `${customers.length} Customers`,
      badgeColor: 'bg-teal-500/20 text-teal-300',
      actionText: 'Customer Dues'
    },
    {
      id: 'COMPANIES',
      title: 'Company Stock Matrix',
      titleBn: 'কোম্পানি স্টক ও মহাজন',
      desc: 'Aman Plastic, Jihan Toy, Dhaka Mart, China Imports live stock & consignment balances.',
      icon: Building2,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      badge: '4 Manufacturers',
      badgeColor: 'bg-indigo-500/20 text-indigo-300',
      actionText: 'Company Inventory'
    },
    {
      id: 'STAFF',
      title: 'Staff Attendance & Payroll',
      titleBn: 'হাজিরা ও বেতন খাতা',
      desc: 'Daily attendance mark (Present, Absent, Leave), advances, and monthly salary payouts.',
      icon: CalendarCheck,
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      badge: `${staffList.length} Active Staff`,
      badgeColor: 'bg-cyan-500/20 text-cyan-300',
      actionText: 'Staff & Salary'
    },
    {
      id: 'PROFIT',
      title: 'Profit & Financial Analytics',
      titleBn: 'লাভ-ক্ষতি ও ব্যালেন্স শিট',
      desc: 'Gross & Net Profit, COGS purchase cost analysis, company margins, export reports.',
      icon: TrendingUp,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      badge: 'Full Balance Sheet',
      badgeColor: 'bg-rose-500/20 text-rose-300',
      actionText: 'Financial Reports'
    },
    {
      id: 'INVOICES',
      title: 'Invoice History & Receipts',
      titleBn: 'বিল ও প্রিন্ট ভাউচার',
      desc: 'Audit trail of all invoices with 80mm thermal POS & A4 format bilingual print.',
      icon: Receipt,
      color: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      badge: `${invoices.length} Invoices`,
      badgeColor: 'bg-orange-500/20 text-orange-300',
      actionText: 'Invoice Archive'
    },
    {
      id: 'SHOPS',
      title: 'Multi-Shop & Godown',
      titleBn: 'দোকান ও গোডাউন স্টক',
      desc: 'Main Showroom (Jalsa Market), Branch 2, and Central Godown / Warehouse.',
      icon: Store,
      color: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      badge: `${shops.length} Locations`,
      badgeColor: 'bg-sky-500/20 text-sky-300',
      actionText: 'Shop Setup'
    },
    {
      id: 'BACKUP',
      title: 'Backup & Supabase Cloud',
      titleBn: 'অফলাইন ও ক্লাউড ব্যাকআপ',
      desc: 'Offline JSON & DB file downloads, one-click restore, Supabase Cloud auto-sync.',
      icon: HardDrive,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badge: 'Offline + Cloud',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      actionText: 'Backup Settings'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Hero Banner & Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                Business Management Suite
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Toy Gallery POS & Wholesale Hub</span>
              <span className="text-amber-400 text-base sm:text-lg font-bold font-serif">(খেলনা গ্যালারি)</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300">
              Proprietor: <strong className="text-amber-400">Farhad Hossain</strong> | Jalsa Market, Chittagong • Multi-Shop & Inward Inventory
            </p>
          </div>

          {/* Action Buttons Header */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowApkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 text-xs transition transform hover:scale-[1.02] cursor-pointer animate-pulse"
              title="Download & Install Android APK / App"
            >
              <Smartphone className="w-4 h-4" />
              <span>📱 Install Android APK</span>
            </button>

            <button
              onClick={() => {
                if (onOpenDashboardUrl) {
                  onOpenDashboardUrl();
                } else {
                  onNavigateTab('DASHBOARD');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 text-xs transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Business Dashboard</span>
            </button>

            <button
              onClick={() => onNavigateTab('POS')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 text-xs transition transform hover:scale-[1.02]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Billing Counter</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* PRIMARY FINANCIAL METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Today's Sales */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Today's Sales</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-white">
              {todaySales.toLocaleString()} <span className="text-xs text-amber-400 font-semibold">TK</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>Paid: {todayPaid.toLocaleString()} TK</span>
            </div>
          </div>

          {/* Cash in Drawer */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Cash in Drawer</span>
              <Banknote className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className={`text-lg sm:text-xl font-black ${netCashInDrawer >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {netCashInDrawer.toLocaleString()} <span className="text-xs font-semibold">TK</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Active counter cash
            </div>
          </div>

          {/* Customer Dues (Receivables) */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Customer Due</span>
              <Users className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-rose-400">
              {totalCustomerDues.toLocaleString()} <span className="text-xs text-slate-300 font-semibold">TK</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {customers.filter(c => c.currentDue > 0).length} parties outstanding
            </div>
          </div>

          {/* Supplier Dues (Payables) */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Supplier Due</span>
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-purple-300">
              {totalSupplierDues.toLocaleString()} <span className="text-xs text-slate-300 font-semibold">TK</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Payable to manufacturers
            </div>
          </div>

          {/* Inventory Valuation */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Stock Valuation</span>
              <Boxes className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-lg sm:text-xl font-black text-blue-300">
              {totalStockValuationCost.toLocaleString()} <span className="text-xs text-slate-300 font-semibold">TK</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Retail: {totalStockValuationSale.toLocaleString()} TK
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-sm hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Low Stock</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <div className={`text-lg sm:text-xl font-black ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {lowStockItems.length} <span className="text-xs text-slate-300 font-semibold">Items</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {lowStockItems.length > 0 ? 'Reorder needed' : 'Healthy inventory'}
            </div>
          </div>

        </div>

        {/* ALL MODULES CATALOG GRID */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Business Management Modules / মডিউলসমূহ
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Role: <strong className="text-amber-400 uppercase">{currentUserRole.replace('_', ' ')}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modules.map((m) => {
              const IconComp = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => onNavigateTab(m.id)}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-400/50 p-4 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 rounded-xl border ${m.color}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition flex items-center justify-between">
                        <span>{m.title}</span>
                      </h3>
                      <p className="text-xs text-amber-400/90 font-medium">{m.titleBn}</p>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                    <span>{m.actionText}</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* OPERATIONS & SUMMARY SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2 Cols: Recent Transactions & Billing Status */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="font-black text-sm text-white">Recent Sales & Invoices / সাম্প্রতিক বিক্রয়</h3>
              </div>
              <button
                onClick={() => onNavigateTab('INVOICES')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                <span>View All ({invoices.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No invoices created yet. Launch the POS Billing counter to issue cash memos.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Shop</th>
                      <th className="p-2.5 text-right">Bill Amount</th>
                      <th className="p-2.5 text-right">Paid</th>
                      <th className="p-2.5 text-right">Running Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoices.slice(0, 5).map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-2.5 font-bold text-amber-400">{inv.invoiceNumber}</td>
                        <td className="p-2.5 text-white font-medium">{inv.customerName}</td>
                        <td className="p-2.5 text-slate-400">{inv.shopName}</td>
                        <td className="p-2.5 text-right font-black text-slate-100">
                          {inv.currentBill.toLocaleString()} TK
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-400">
                          {inv.paidNow.toLocaleString()} TK
                        </td>
                        <td className="p-2.5 text-right font-bold text-rose-400">
                          {inv.netTotalDue.toLocaleString()} TK
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onNavigateTab('POS')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Create New Sale Invoice (ক্যাশ মেমো)</span>
              </button>
            </div>
          </div>

          {/* Right Col: Quick Store & Company Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-400" />
                  <h3 className="font-black text-sm text-white">Active Outlets & Godown</h3>
                </div>
                <button
                  onClick={() => onNavigateTab('SHOPS')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-2">
                {shops.map((s) => (
                  <div
                    key={s.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      s.id === activeShop?.id
                        ? 'bg-amber-500/10 border-amber-400/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{s.name}</span>
                        {s.isMain && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-amber-400 text-slate-950 font-black rounded">
                            MAIN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">{s.address}</span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {s.id === activeShop?.id ? 'ACTIVE' : 'READY'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Manufacturers List */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  Partner Toy Manufacturers:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {companies.map((c) => (
                    <div key={c.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      <div className="font-bold text-white text-[11px] truncate">{c.name}</div>
                      <div className="text-[10px] text-purple-400 font-semibold">
                        Due: {(supplierDuesMap[c.id!] || 0).toLocaleString()} TK
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('BACKUP')}
              className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs transition border border-slate-700 flex items-center justify-center gap-2"
            >
              <HardDrive className="w-4 h-4" />
              <span>Full Offline Backup & Supabase Sync</span>
            </button>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 text-slate-500 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Toy Gallery POS & Management System • Chittagong, Bangladesh</span>
          <span>Single-Source IndexedDB Offline-First Architecture with Supabase Cloud Sync</span>
        </div>
      </footer>

      <ApkInstallModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />

    </div>
  );
}
