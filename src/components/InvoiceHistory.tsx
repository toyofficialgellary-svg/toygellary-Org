import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, db } from '../db/db';
import { Receipt, Search, Printer, Calendar, User, Store } from 'lucide-react';

interface InvoiceHistoryProps {
  onOpenPreview: (invoice: Invoice, items: InvoiceItem[]) => void;
}

export const InvoiceHistory: React.FC<InvoiceHistoryProps> = ({ onOpenPreview }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadInvoices = () => {
    db.invoices.reverse().sortBy('date').then(setInvoices);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const filtered = invoices.filter(inv => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerName.toLowerCase().includes(q) ||
      inv.shopName.toLowerCase().includes(q) ||
      inv.paymentMethod.toLowerCase().includes(q)
    );
  });

  const handleOpen = async (inv: Invoice) => {
    const items = await db.invoiceItems.where('invoiceId').equals(inv.id!).toArray();
    onOpenPreview(inv, items);
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Invoice History / বিক্রয় রশিদ ও চালান</span>
          </h2>
          <p className="text-xs text-slate-500">
            Total {invoices.length} Invoices generated • Click any invoice to reprint in POS 80mm / A4
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, customer name..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-slate-800"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(inv => {
          const dateStr = new Date(inv.date).toLocaleString('en-GB');

          return (
            <div
              key={inv.id}
              onClick={() => handleOpen(inv)}
              className="bg-white border border-slate-200 hover:border-slate-400 rounded-xl p-4 shadow-sm cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono font-bold text-sm text-slate-950 group-hover:text-indigo-600 transition">
                      {inv.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-700">
                    {inv.paymentMethod}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 my-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inv.customerName} ({inv.customerType})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inv.shopName}</span>
                  </div>
                </div>

                {/* Amounts Breakdown */}
                <div className="space-y-1 text-xs pt-1 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Bill:</span>
                    <span className="font-semibold text-slate-900">৳{inv.currentBill}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Paid Now:</span>
                    <span className="font-bold">৳{inv.paidNow}</span>
                  </div>
                  <div className="flex justify-between font-bold text-rose-700 pt-1 border-t border-dashed border-slate-200">
                    <span>Net Total Due:</span>
                    <span className="font-black text-sm">৳{inv.netTotalDue} TK</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-3 w-full py-1.5 bg-slate-100 group-hover:bg-slate-900 group-hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition text-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View & Print</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
