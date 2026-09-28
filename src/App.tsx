import React, { useState, useEffect } from 'react';
import { 
  db, 
  seedInitialData, 
  Shop, 
  Product, 
  Company, 
  Customer, 
  Invoice, 
  InvoiceItem 
} from './db/db';
import { PosHeader } from './components/PosHeader';
import { PosBilling } from './components/PosBilling';
import { ProductMaster } from './components/ProductMaster';
import { CompanyStock } from './components/CompanyStock';
import { CustomerRegister } from './components/CustomerRegister';
import { InvoiceHistory } from './components/InvoiceHistory';
import { MultiShop } from './components/MultiShop';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { PurchaseManager } from './components/PurchaseManager';
import { DailyAccounts } from './components/DailyAccounts';
import { StaffAttendanceSalary } from './components/StaffAttendanceSalary';
import { ProfitDashboard } from './components/ProfitDashboard';
import { BackupSystem } from './components/BackupSystem';
import { BusinessDashboard } from './components/BusinessDashboard';
import { 
  LayoutDashboard,
  ShoppingCart, 
  Package, 
  Building2, 
  Users, 
  Receipt, 
  Store,
  Truck,
  Wallet,
  CalendarCheck,
  TrendingUp,
  HardDrive,
  ShieldAlert
} from 'lucide-react';

type Tab = 
  | 'DASHBOARD'
  | 'POS' 
  | 'PRODUCTS' 
  | 'PURCHASES' 
  | 'COMPANIES' 
  | 'CUSTOMERS' 
  | 'ACCOUNTS' 
  | 'STAFF' 
  | 'PROFIT' 
  | 'INVOICES' 
  | 'SHOPS' 
  | 'BACKUP';

export function App() {
  const getInitialTab = (): Tab => {
    if (typeof window === 'undefined') return 'DASHBOARD';
    
    // Check URL query param e.g. ?tab=pos or ?tab=dashboard
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab')?.toUpperCase();
    if (tabParam && ['DASHBOARD', 'POS', 'PRODUCTS', 'PURCHASES', 'COMPANIES', 'CUSTOMERS', 'ACCOUNTS', 'STAFF', 'PROFIT', 'INVOICES', 'SHOPS', 'BACKUP'].includes(tabParam)) {
      return tabParam as Tab;
    }

    // Check URL hash e.g. #/pos or #dashboard
    const hash = window.location.hash.replace('#/', '').replace('#', '').toLowerCase();
    if (hash === 'pos') return 'POS';
    if (hash === 'products') return 'PRODUCTS';
    if (hash === 'purchases') return 'PURCHASES';
    if (hash === 'companies') return 'COMPANIES';
    if (hash === 'customers') return 'CUSTOMERS';
    if (hash === 'accounts') return 'ACCOUNTS';
    if (hash === 'staff') return 'STAFF';
    if (hash === 'profit') return 'PROFIT';
    if (hash === 'invoices') return 'INVOICES';
    if (hash === 'shops') return 'SHOPS';
    if (hash === 'backup') return 'BACKUP';
    if (hash === 'dashboard') return 'DASHBOARD';

    // Check pathname
    const path = window.location.pathname.toLowerCase();
    if (path === '/pos') return 'POS';
    if (path === '/products') return 'PRODUCTS';
    if (path === '/purchases') return 'PURCHASES';
    if (path === '/companies') return 'COMPANIES';
    if (path === '/customers') return 'CUSTOMERS';
    if (path === '/accounts') return 'ACCOUNTS';
    if (path === '/staff') return 'STAFF';
    if (path === '/profit') return 'PROFIT';
    if (path === '/invoices') return 'INVOICES';
    if (path === '/shops') return 'SHOPS';
    if (path === '/backup') return 'BACKUP';
    
    // Default to Business Dashboard on root "/"
    return 'DASHBOARD';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);
  const [languageMode, setLanguageMode] = useState<'EN' | 'BN' | 'BOTH'>('BOTH');
  const [currentUserRole, setCurrentUserRole] = useState<'SUPER_ADMIN' | 'MANAGER' | 'SALESMAN'>('SUPER_ADMIN');
  
  // Database state
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShop, setActiveShop] = useState<Shop | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stocksMap, setStocksMap] = useState<Record<number, number>>({});

  // Active print invoice
  const [printInvoiceData, setPrintInvoiceData] = useState<{
    invoice: Invoice;
    items: InvoiceItem[];
  } | null>(null);

  // Quick Add Customer Modal
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustType, setNewCustType] = useState<'LOCAL' | 'OUTSIDE'>('LOCAL');
  const [newCustDue, setNewCustDue] = useState<number>(0);

  // Load database data
  const loadData = async () => {
    await seedInitialData();

    const loadedShops = await db.shops.toArray();
    setShops(loadedShops);
    const mainShop = loadedShops.find(s => s.isMain) || loadedShops[0];
    if (!activeShop && mainShop) {
      setActiveShop(mainShop);
    }

    const loadedProducts = await db.products.toArray();
    setProducts(loadedProducts);

    const loadedCompanies = await db.companies.toArray();
    setCompanies(loadedCompanies);

    const loadedCustomers = await db.customers.toArray();
    setCustomers(loadedCustomers);

    // Load stock for current shop
    const currentShopId = activeShop?.id || mainShop?.id;
    if (currentShopId) {
      const stocks = await db.stocks.where('shopId').equals(currentShopId).toArray();
      const map: Record<number, number> = {};
      stocks.forEach(s => {
        map[s.productId] = s.totalPcs;
      });
      setStocksMap(map);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeShop?.id]);

  // Low stock products count
  const lowStockCount = products.filter(p => {
    const totalPcs = stocksMap[p.id!] || 0;
    const cartons = p.pcsPerCarton > 0 ? Math.floor(totalPcs / p.pcsPerCarton) : 0;
    return cartons <= p.lowStockThresholdCartons;
  }).length;

  const handleSaveQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const id = await db.customers.add({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      customerType: newCustType,
      currentDue: Number(newCustDue) || 0,
      createdAt: Date.now()
    });

    if (newCustDue > 0) {
      await db.customerLedger.add({
        customerId: id,
        date: Date.now(),
        type: 'OPENING_DUE',
        reference: 'Opening Due Balance',
        debit: Number(newCustDue),
        credit: 0,
        balance: Number(newCustDue),
        notes: 'Initial opening ledger balance'
      });
    }

    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustDue(0);
    setShowQuickAddCustomer(false);
    loadData();
  };

  const handleNavigateTab = (tab: Tab) => {
    setActiveTab(tab);
    const targetPath = tab === 'DASHBOARD' ? '/dashboard' : `/${tab.toLowerCase()}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleOpenDashboard = () => {
    handleNavigateTab('DASHBOARD');
  };

  // Sync state with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getInitialTab());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-950 flex flex-col font-sans">
      
      {/* PosHeader Bar */}
      <PosHeader
        activeShop={activeShop}
        shops={shops}
        onSelectShop={(s) => setActiveShop(s)}
        languageMode={languageMode}
        onSelectLanguage={setLanguageMode}
        lowStockCount={lowStockCount}
        onLowStockClick={() => handleNavigateTab('PRODUCTS')}
        currentUserRole={currentUserRole}
        onSelectUserRole={(role) => setCurrentUserRole(role)}
        onOpenDashboard={handleOpenDashboard}
      />

      {/* Desktop Top Module Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-xs px-4 py-2 hidden lg:flex items-center gap-1.5 overflow-x-auto shadow-sm">
        <button
          onClick={() => handleNavigateTab('DASHBOARD')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'DASHBOARD'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => handleNavigateTab('POS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'POS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>POS Billing</span>
        </button>

        <button
          onClick={() => handleNavigateTab('PRODUCTS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'PRODUCTS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Products</span>
        </button>

        <button
          onClick={() => handleNavigateTab('PURCHASES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'PURCHASES'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Purchase & Inward</span>
        </button>

        <button
          onClick={() => handleNavigateTab('ACCOUNTS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'ACCOUNTS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Daily Accounts</span>
        </button>

        <button
          onClick={() => handleNavigateTab('CUSTOMERS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'CUSTOMERS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customers & Due</span>
        </button>

        <button
          onClick={() => handleNavigateTab('COMPANIES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'COMPANIES'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Company Stock</span>
        </button>

        <button
          onClick={() => handleNavigateTab('STAFF')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'STAFF'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Staff & Salary</span>
        </button>

        <button
          onClick={() => handleNavigateTab('PROFIT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'PROFIT'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Profit & Reports</span>
        </button>

        <button
          onClick={() => handleNavigateTab('INVOICES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'INVOICES'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Invoices</span>
        </button>

        <button
          onClick={() => handleNavigateTab('SHOPS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'SHOPS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Multi-Shop</span>
        </button>

        <button
          onClick={() => handleNavigateTab('BACKUP')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
            activeTab === 'BACKUP'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Backup & Sync</span>
        </button>
      </div>

      {/* Role permission restriction banner if needed */}
      {currentUserRole === 'SALESMAN' && ['PURCHASES', 'ACCOUNTS', 'STAFF', 'PROFIT', 'SHOPS', 'BACKUP'].includes(activeTab) && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Salesman Role Active: Restricted from managerial & financial administrative tabs.</span>
          </div>
          <button
            onClick={() => handleNavigateTab('POS')}
            className="px-2.5 py-1 bg-slate-950 text-white rounded text-[10px]"
          >
            Return to POS
          </button>
        </div>
      )}

      {currentUserRole === 'MANAGER' && ['PROFIT', 'BACKUP'].includes(activeTab) && (
        <div className="bg-purple-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Manager Role: Profit Dashboard & Backup System require Super Admin (Owner Farhad Hossain) role.</span>
          </div>
          <button
            onClick={() => handleNavigateTab('POS')}
            className="px-2.5 py-1 bg-white text-purple-900 rounded text-[10px]"
          >
            Return to POS
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-950 pb-20 lg:pb-8">
        {activeTab === 'DASHBOARD' && (
          <BusinessDashboard
            shops={shops}
            activeShop={activeShop}
            products={products}
            customers={customers}
            companies={companies}
            stocksMap={stocksMap}
            languageMode={languageMode}
            currentUserRole={currentUserRole}
            onNavigateTab={handleNavigateTab}
            onOpenDashboardUrl={handleOpenDashboard}
          />
        )}

        {activeShop && activeTab !== 'DASHBOARD' && (
          <>
            {activeTab === 'POS' && (
              <PosBilling
                activeShop={activeShop}
                products={products}
                customers={customers}
                stocksMap={stocksMap}
                languageMode={languageMode}
                onInvoiceCreated={(invoice, items) => {
                  setPrintInvoiceData({ invoice, items });
                  loadData();
                }}
                onAddNewCustomer={() => setShowQuickAddCustomer(true)}
              />
            )}

            {activeTab === 'PRODUCTS' && (
              <ProductMaster
                products={products}
                companies={companies}
                shops={shops}
                activeShop={activeShop}
                stocksMap={stocksMap}
                languageMode={languageMode}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'PURCHASES' && (
              <PurchaseManager
                shops={shops}
                activeShop={activeShop}
                companies={companies}
                products={products}
                languageMode={languageMode}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'COMPANIES' && (
              <CompanyStock
                companies={companies}
                products={products}
                activeShop={activeShop}
                stocksMap={stocksMap}
                languageMode={languageMode}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'CUSTOMERS' && (
              <CustomerRegister
                customers={customers}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'ACCOUNTS' && (
              <DailyAccounts
                shops={shops}
                activeShop={activeShop}
                languageMode={languageMode}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'STAFF' && (
              <StaffAttendanceSalary
                shops={shops}
                activeShop={activeShop}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'PROFIT' && (
              <ProfitDashboard
                shops={shops}
                activeShop={activeShop}
                products={products}
                languageMode={languageMode}
              />
            )}

            {activeTab === 'INVOICES' && (
              <InvoiceHistory
                onOpenPreview={(invoice, items) => {
                  setPrintInvoiceData({ invoice, items });
                }}
              />
            )}

            {activeTab === 'SHOPS' && (
              <MultiShop
                shops={shops}
                activeShop={activeShop}
                onSelectShop={(s) => setActiveShop(s)}
                onRefresh={loadData}
              />
            )}

            {activeTab === 'BACKUP' && (
              <BackupSystem
                onRefresh={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Modern POS Navigation Bar (Scrollable Bottom Bar for Mobile & Quick Access) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 text-white shadow-2xl no-print overflow-x-auto">
        <div className="max-w-7xl mx-auto px-2 flex items-center justify-between min-w-max">
          <button
            onClick={() => handleNavigateTab('DASHBOARD')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'DASHBOARD' ? 'text-amber-400 border-t-2 border-amber-400 bg-slate-800/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 mb-0.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNavigateTab('POS')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'POS' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4 mb-0.5" />
            <span>POS Billing</span>
          </button>

          <button
            onClick={() => handleNavigateTab('PRODUCTS')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'PRODUCTS' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span>Products</span>
          </button>

          <button
            onClick={() => handleNavigateTab('PURCHASES')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'PURCHASES' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4 mb-0.5" />
            <span>Purchase & Due</span>
          </button>

          <button
            onClick={() => handleNavigateTab('COMPANIES')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'COMPANIES' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 mb-0.5" />
            <span>Company Stock</span>
          </button>

          <button
            onClick={() => handleNavigateTab('CUSTOMERS')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'CUSTOMERS' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mb-0.5" />
            <span>Customers & Due</span>
          </button>

          <button
            onClick={() => handleNavigateTab('ACCOUNTS')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'ACCOUNTS' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4 mb-0.5" />
            <span>Daily Accounts</span>
          </button>

          <button
            onClick={() => handleNavigateTab('STAFF')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'STAFF' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4 mb-0.5" />
            <span>Staff & Salary</span>
          </button>

          <button
            onClick={() => handleNavigateTab('PROFIT')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'PROFIT' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span>Profit & Reports</span>
          </button>

          <button
            onClick={() => handleNavigateTab('INVOICES')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'INVOICES' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4 mb-0.5" />
            <span>Invoices</span>
          </button>

          <button
            onClick={() => handleNavigateTab('SHOPS')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'SHOPS' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Store className="w-4 h-4 mb-0.5" />
            <span>Shops</span>
          </button>

          <button
            onClick={() => handleNavigateTab('BACKUP')}
            className={`flex flex-col items-center py-2 px-2.5 text-[10px] font-bold transition ${
              activeTab === 'BACKUP' ? 'text-amber-400 border-t-2 border-amber-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4 mb-0.5" />
            <span>Backup & Cloud</span>
          </button>
        </div>
      </nav>

      {/* Invoice Print & Reprint Modal */}
      {printInvoiceData && (
        <InvoicePrintModal
          invoice={printInvoiceData.invoice}
          items={printInvoiceData.items}
          initialLanguage={languageMode}
          onClose={() => setPrintInvoiceData(null)}
        />
      )}

      {/* Quick Add Customer Modal */}
      {showQuickAddCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 no-print">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900">
            <h3 className="font-black text-base text-slate-900 mb-1">Add Customer / কাস্টমার যোগ</h3>
            <p className="text-xs text-slate-500 mb-3">Add on same billing page with classification & previous due</p>

            <form onSubmit={handleSaveQuickCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Classification:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCustType('LOCAL')}
                    className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                      newCustType === 'LOCAL' ? 'bg-teal-700 text-white border-teal-700' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Local (Chittagong)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCustType('OUTSIDE')}
                    className={`flex-1 py-1.5 rounded-lg font-bold border transition ${
                      newCustType === 'OUTSIDE' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Outside
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Customer / Shop Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Al-Madina Toy Store"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="018XXXXXXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Address / Market</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="e.g. Anderkilla, Chittagong"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Previous / Opening Due (TK)</label>
                <input
                  type="number"
                  min="0"
                  value={newCustDue || ''}
                  onChange={(e) => setNewCustDue(Number(e.target.value) || 0)}
                  placeholder="0 or 20000"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-rose-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
