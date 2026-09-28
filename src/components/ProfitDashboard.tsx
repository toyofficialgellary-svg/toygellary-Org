import React, { useState, useEffect } from 'react';
import { 
  db, 
  Shop, 
  Product, 
  Invoice, 
  InvoiceItem, 
  DailyAccount, 
  StaffSalaryPayment, 
  Customer, 
  Company, 
  SupplierLedger,
  exportToCsvWithBom 
} from '../db/db';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart3, 
  PieChart, 
  Download, 
  Calendar, 
  Building2, 
  Users, 
  Layers, 
  Printer 
} from 'lucide-react';

interface ProfitDashboardProps {
  shops: Shop[];
  activeShop: Shop;
  products: Product[];
  languageMode: 'EN' | 'BN' | 'BOTH';
}

export function ProfitDashboard({
  shops,
  activeShop,
  products,
  languageMode
}: ProfitDashboardProps) {
  const [dateRange, setDateRange] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL'>('THIS_MONTH');
  const [selectedShopFilter, setSelectedShopFilter] = useState<number>(0); // 0 = All Shops
  const [activeReportTab, setActiveReportTab] = useState<'DASHBOARD' | 'SALES_REPORT' | 'STOCK_REPORT' | 'DUES_REPORT'>('DASHBOARD');

  // Loaded data
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [dailyExpenses, setDailyExpenses] = useState<DailyAccount[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<StaffSalaryPayment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [supplierDues, setSupplierDues] = useState<Record<number, number>>({});
  const [stocksMap, setStocksMap] = useState<Record<string, number>>({}); // shopId-prodId -> totalPcs

  const loadData = async () => {
    const invs = await db.invoices.toArray();
    const items = await db.invoiceItems.toArray();
    const accs = await db.dailyAccounts.toArray();
    const sals = await db.staffSalaries.toArray();
    const custs = await db.customers.toArray();
    const comps = await db.companies.toArray();
    const stocks = await db.stocks.toArray();

    // Stocks map
    const smap: Record<string, number> = {};
    stocks.forEach(s => {
      smap[`${s.shopId}-${s.productId}`] = s.totalPcs;
    });
    setStocksMap(smap);

    // Supplier dues
    const sdues: Record<number, number> = {};
    for (const c of comps) {
      if (c.id) {
        const last = await db.supplierLedger.where('companyId').equals(c.id).last();
        sdues[c.id] = last ? last.balance : 0;
      }
    }
    setSupplierDues(sdues);

    // Date filtering
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - (now.getDay() * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filterByDate = (timestamp: number) => {
      if (dateRange === 'TODAY') return timestamp >= todayStart;
      if (dateRange === 'THIS_WEEK') return timestamp >= weekStart;
      if (dateRange === 'THIS_MONTH') return timestamp >= monthStart;
      return true;
    };

    setInvoices(invs.filter(i => filterByDate(i.date) && (!selectedShopFilter || i.shopId === selectedShopFilter)));
    setInvoiceItems(items);
    setDailyExpenses(accs.filter(a => a.type === 'EXPENSE' && filterByDate(a.date) && (!selectedShopFilter || a.shopId === selectedShopFilter)));
    setSalaryPayments(sals.filter(s => filterByDate(s.paymentDate)));
    setCustomers(custs);
    setCompanies(comps);
  };

  useEffect(() => {
    loadData();
  }, [dateRange, selectedShopFilter]);

  // Financial Calculations
  const invoiceIds = new Set(invoices.map(i => i.id));
  const filteredInvoiceItems = invoiceItems.filter(it => invoiceIds.has(it.invoiceId));

  // Gross Sales
  const grossSales = invoices.reduce((sum, inv) => sum + inv.currentBill, 0);

  // Cost of Goods Sold (COGS)
  const cogs = filteredInvoiceItems.reduce((sum, it) => {
    const prod = products.find(p => p.id === it.productId);
    const costPerPc = prod ? prod.purchasePricePc : 0;
    return sum + (it.totalPcs * costPerPc);
  }, 0);

  // Gross Profit
  const grossProfit = Math.max(0, grossSales - cogs);
  const grossMargin = grossSales > 0 ? (grossProfit / grossSales) * 100 : 0;

  // Operating Expenses
  const totalOperatingExpenses = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Staff Salaries
  const totalSalaries = salaryPayments.reduce((sum, sal) => sum + sal.amountPaid, 0);

  // Net Profit
  const netProfit = grossProfit - totalOperatingExpenses - totalSalaries;
  const netMargin = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;

  // Total Customer Dues
  const totalCustomerDues = customers.reduce((sum, c) => sum + c.currentDue, 0);
  const localCustomerDues = customers.filter(c => c.customerType === 'LOCAL').reduce((sum, c) => sum + c.currentDue, 0);
  const outsideCustomerDues = customers.filter(c => c.customerType === 'OUTSIDE').reduce((sum, c) => sum + c.currentDue, 0);

  // Total Supplier Dues
  const totalSupplierDues = Object.values(supplierDues).reduce((sum, d) => sum + d, 0);

  // Inventory Valuation (At purchase price and selling price)
  let totalStockValuationCost = 0;
  let totalStockValuationSale = 0;
  products.forEach(p => {
    shops.forEach(s => {
      const pcs = stocksMap[`${s.id}-${p.id}`] || 0;
      totalStockValuationCost += pcs * p.purchasePricePc;
      totalStockValuationSale += pcs * p.sellingPricePc;
    });
  });

  // Top Selling Products
  const prodSalesMap: Record<number, { prod: Product; totalPcs: number; totalSales: number; profit: number }> = {};
  filteredInvoiceItems.forEach(it => {
    const prod = products.find(p => p.id === it.productId);
    if (!prod) return;
    if (!prodSalesMap[prod.id!]) {
      prodSalesMap[prod.id!] = { prod, totalPcs: 0, totalSales: 0, profit: 0 };
    }
    const cost = it.totalPcs * prod.purchasePricePc;
    const rev = it.totalAmount;
    prodSalesMap[prod.id!].totalPcs += it.totalPcs;
    prodSalesMap[prod.id!].totalSales += rev;
    prodSalesMap[prod.id!].profit += Math.max(0, rev - cost);
  });
  const topProducts = Object.values(prodSalesMap).sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);

  // Company-wise Sales & Profit
  const companySalesMap: Record<string, { totalSales: number; profit: number }> = {};
  filteredInvoiceItems.forEach(it => {
    const prod = products.find(p => p.id === it.productId);
    const compName = prod?.companyName || 'Other';
    if (!companySalesMap[compName]) {
      companySalesMap[compName] = { totalSales: 0, profit: 0 };
    }
    const cost = it.totalPcs * (prod?.purchasePricePc || 0);
    companySalesMap[compName].totalSales += it.totalAmount;
    companySalesMap[compName].profit += Math.max(0, it.totalAmount - cost);
  });

  // Export Sales & Profit Report to Excel
  const handleExportSalesReport = () => {
    let csv = `Invoice Number,Date,Shop,Customer,Customer Type,Total Items,Bill (TK),Paid (TK),Bill Due (TK),Net Total Due (TK)\n`;
    invoices.forEach(inv => {
      const dateStr = new Date(inv.date).toLocaleString('en-GB');
      csv += `"${inv.invoiceNumber}","${dateStr}","${inv.shopName}","${inv.customerName}","${inv.customerType}","${inv.totalItems}","${inv.currentBill}","${inv.paidNow}","${inv.billDue}","${inv.netTotalDue}"\n`;
    });
    exportToCsvWithBom(`Toy_Gallery_Sales_Report_${dateRange}.csv`, csv);
  };

  // Export Inventory Valuation to Excel
  const handleExportStockReport = () => {
    let csv = `SKU,Product Name (English),Product Name (Bangla),Company,Pcs Per Carton,Purchase Price / Ctn,Selling Price / Ctn,Total Stock (Pcs),Valuation Cost (TK),Valuation Selling (TK)\n`;
    products.forEach(p => {
      let totalPcs = 0;
      shops.forEach(s => {
        totalPcs += stocksMap[`${s.id}-${p.id}`] || 0;
      });
      const costVal = totalPcs * p.purchasePricePc;
      const saleVal = totalPcs * p.sellingPricePc;
      csv += `"${p.sku}","${p.nameEn}","${p.nameBn}","${p.companyName}","${p.pcsPerCarton}","${p.purchasePriceCarton}","${p.sellingPriceCarton}","${totalPcs}","${costVal}","${saleVal}"\n`;
    });
    exportToCsvWithBom(`Toy_Gallery_Stock_Valuation.csv`, csv);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-xs">
      {/* Top Header & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveReportTab('DASHBOARD')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
              activeReportTab === 'DASHBOARD'
                ? 'bg-slate-900 text-amber-400'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Profit Dashboard / লাভ-ক্ষতি ড্যাশবোর্ড</span>
          </button>

          <button
            onClick={() => setActiveReportTab('SALES_REPORT')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
              activeReportTab === 'SALES_REPORT'
                ? 'bg-slate-900 text-amber-400'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Sales & Invoices Report</span>
          </button>

          <button
            onClick={() => setActiveReportTab('STOCK_REPORT')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
              activeReportTab === 'STOCK_REPORT'
                ? 'bg-slate-900 text-amber-400'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Stock Valuation Report</span>
          </button>

          <button
            onClick={() => setActiveReportTab('DUES_REPORT')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
              activeReportTab === 'DUES_REPORT'
                ? 'bg-slate-900 text-amber-400'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer & Supplier Dues</span>
          </button>
        </div>

        {/* Date and Shop Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'ALL'] as const).map(dr => (
              <button
                key={dr}
                onClick={() => setDateRange(dr)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                  dateRange === dr ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {dr === 'TODAY' ? 'Today' : dr === 'THIS_WEEK' ? 'Week' : dr === 'THIS_MONTH' ? 'Month' : 'All'}
              </button>
            ))}
          </div>

          <select
            value={selectedShopFilter}
            onChange={(e) => setSelectedShopFilter(Number(e.target.value))}
            className="p-1.5 bg-white border border-slate-200 rounded-xl font-bold"
          >
            <option value={0}>All Shops</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. DASHBOARD VIEW */}
      {activeReportTab === 'DASHBOARD' && (
        <div className="space-y-4">
          {/* Main Profit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Gross Revenue */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Sales (মোট বিক্রি)</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black text-slate-900 block">
                {grossSales.toLocaleString()} TK
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {invoices.length} invoices generated
              </span>
            </div>

            {/* Cost of Goods Sold */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Cost of Goods (COGS - ক্রয়মূল্য)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black text-slate-700 block">
                {cogs.toLocaleString()} TK
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Product purchase cost
              </span>
            </div>

            {/* Gross Profit */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Profit (মোট লাভ)</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <span className="text-2xl font-black text-emerald-700 block">
                {grossProfit.toLocaleString()} TK
              </span>
              <span className="text-[10px] font-bold text-emerald-600 mt-1 block">
                Margin: {grossMargin.toFixed(1)}%
              </span>
            </div>

            {/* Net Profit after Expenses & Salaries */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Net Profit (খাঁটি লাভ)</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <span className={`text-2xl font-black block ${netProfit >= 0 ? 'text-purple-700' : 'text-rose-700'}`}>
                {netProfit.toLocaleString()} TK
              </span>
              <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                After expenses ({totalOperatingExpenses.toLocaleString()}) & salaries ({totalSalaries.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Dues & Working Capital Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Customer Receivables (কাস্টমার বাকি)</span>
              <span className="text-xl font-black text-rose-700 block">
                {totalCustomerDues.toLocaleString()} TK
              </span>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span>Local (Ctg): <b className="text-slate-800">{localCustomerDues.toLocaleString()}</b></span>
                <span>Outside: <b className="text-slate-800">{outsideCustomerDues.toLocaleString()}</b></span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Supplier Payables (মহাজন বাকি)</span>
              <span className="text-xl font-black text-amber-700 block">
                {totalSupplierDues.toLocaleString()} TK
              </span>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                Owed across {companies.length} toy manufacturing companies
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Stock Valuation (স্টক মোট মূল্য)</span>
              <span className="text-xl font-black text-slate-900 block">
                {totalStockValuationCost.toLocaleString()} TK
              </span>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span>At Purchase Rate</span>
                <span>Retail Value: <b className="text-emerald-700">{totalStockValuationSale.toLocaleString()} TK</b></span>
              </div>
            </div>
          </div>

          {/* Top Selling Products & Company Share */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Top Selling Products & Profit Margin</span>
              </h4>

              {topProducts.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No sales recorded yet for this period.</div>
              ) : (
                <div className="space-y-2.5">
                  {topProducts.map((item, idx) => {
                    const margin = item.totalSales > 0 ? (item.profit / item.totalSales) * 100 : 0;
                    return (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <span className="font-bold text-slate-900">{item.prod.nameEn}</span>
                            <span className="text-[10px] text-slate-500 block">{item.prod.companyName}</span>
                          </div>
                          <span className="font-black text-emerald-700">{item.totalSales.toLocaleString()} TK</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Sold: <b>{item.totalPcs} Pcs</b> ({Math.floor(item.totalPcs / item.prod.pcsPerCarton)} Ctn)</span>
                          <span>Gross Profit: <b className="text-emerald-800">{item.profit.toLocaleString()} TK ({margin.toFixed(0)}%)</b></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Company Breakdown */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Company-Wise Sales & Profit Contribution</span>
              </h4>

              {Object.keys(companySalesMap).length === 0 ? (
                <div className="p-6 text-center text-slate-400">No company sales data available.</div>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(companySalesMap).map(([compName, data], idx) => {
                    const margin = data.totalSales > 0 ? (data.profit / data.totalSales) * 100 : 0;
                    return (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-900">{compName}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Profit: <b className="text-emerald-700">{data.profit.toLocaleString()} TK</b> ({margin.toFixed(0)}% margin)
                          </span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{data.totalSales.toLocaleString()} TK</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. SALES REPORT VIEW */}
      {activeReportTab === 'SALES_REPORT' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-3">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-900">Sales Invoices Report ({invoices.length})</span>
            <button
              onClick={handleExportSalesReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-xl font-bold shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV (UTF-8 BOM)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Invoice #</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Shop</th>
                  <th className="p-2.5 text-right">Bill Amount</th>
                  <th className="p-2.5 text-right">Paid</th>
                  <th className="p-2.5 text-right">Bill Due</th>
                  <th className="p-2.5 text-right">Net Running Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-bold text-amber-700">{inv.invoiceNumber}</td>
                    <td className="p-2.5 text-slate-500">{new Date(inv.date).toLocaleDateString('en-GB')}</td>
                    <td className="p-2.5 font-bold text-slate-900">{inv.customerName}</td>
                    <td className="p-2.5 text-slate-700">{inv.shopName}</td>
                    <td className="p-2.5 text-right font-black">{inv.currentBill.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-700">{inv.paidNow.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-bold text-rose-700">{inv.billDue.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-black text-slate-900">{inv.netTotalDue.toLocaleString()} TK</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. STOCK VALUATION REPORT */}
      {activeReportTab === 'STOCK_REPORT' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-3">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="font-bold text-slate-900">Inventory Stock Valuation & Rates</span>
            <button
              onClick={handleExportStockReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-xl font-bold shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV (UTF-8 BOM)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Product Name</th>
                  <th className="p-2.5">Company</th>
                  <th className="p-2.5 text-center">Unit</th>
                  <th className="p-2.5 text-right">Purchase Rate / Ctn</th>
                  <th className="p-2.5 text-right">Selling Rate / Ctn</th>
                  <th className="p-2.5 text-center">Total Stock</th>
                  <th className="p-2.5 text-right">Total Valuation (Cost)</th>
                  <th className="p-2.5 text-right">Total Valuation (Retail)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p, idx) => {
                  let totalPcs = 0;
                  shops.forEach(s => {
                    totalPcs += stocksMap[`${s.id}-${p.id}`] || 0;
                  });
                  const ctns = Math.floor(totalPcs / p.pcsPerCarton);
                  const loose = totalPcs % p.pcsPerCarton;
                  const costVal = totalPcs * p.purchasePricePc;
                  const saleVal = totalPcs * p.sellingPricePc;

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        {languageMode === 'BN' ? p.nameBn : p.nameEn}
                      </td>
                      <td className="p-2.5 text-slate-600">{p.companyName}</td>
                      <td className="p-2.5 text-center text-slate-500">1 Ctn = {p.pcsPerCarton} Pcs</td>
                      <td className="p-2.5 text-right">{p.purchasePriceCarton.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">{p.sellingPriceCarton.toLocaleString()}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900">
                        {ctns} Ctn {loose > 0 ? `+ ${loose} Pcs` : ''}
                      </td>
                      <td className="p-2.5 text-right font-black">{costVal.toLocaleString()} TK</td>
                      <td className="p-2.5 text-right font-black text-emerald-700">{saleVal.toLocaleString()} TK</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DUES REPORT */}
      {activeReportTab === 'DUES_REPORT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Customer Dues */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b font-bold text-slate-900 flex justify-between">
              <span>Customer Outstanding Dues ({customers.filter(c => c.currentDue > 0).length})</span>
              <span className="text-rose-700">Total: {totalCustomerDues.toLocaleString()} TK</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5 text-right">Due (TK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.filter(c => c.currentDue > 0).map(c => (
                    <tr key={c.id}>
                      <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.customerType === 'LOCAL' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.customerType}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-500">{c.phone}</td>
                      <td className="p-2.5 text-right font-black text-rose-700">{c.currentDue.toLocaleString()} TK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Supplier Dues */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b font-bold text-slate-900 flex justify-between">
              <span>Supplier Outstanding Dues ({companies.length})</span>
              <span className="text-amber-700">Total: {totalSupplierDues.toLocaleString()} TK</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Company Name</th>
                    <th className="p-2.5">Contact Person</th>
                    <th className="p-2.5 text-right">Payable Due (TK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map(c => {
                    const due = supplierDues[c.id!] || 0;
                    return (
                      <tr key={c.id}>
                        <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                        <td className="p-2.5 text-slate-500">{c.contactPerson} ({c.phone})</td>
                        <td className="p-2.5 text-right font-black text-amber-700">{due.toLocaleString()} TK</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
