import React, { useState } from 'react';
import { Invoice, InvoiceItem } from '../db/db';
import { Printer, Copy, X, Check, Share2, FileText } from 'lucide-react';

interface InvoicePrintModalProps {
  invoice: Invoice;
  items: InvoiceItem[];
  initialLanguage?: 'EN' | 'BN' | 'BOTH';
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  items,
  initialLanguage = 'BOTH',
  onClose
}) => {
  const [printFormat, setPrintFormat] = useState<'POS_80MM' | 'A4'>('POS_80MM');
  const [lang, setLang] = useState<'EN' | 'BN' | 'BOTH'>(initialLanguage);
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(invoice.date).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `
=========================================
          TOY GALLERY (টয় গ্যালারী)
  Jalsa Market 2nd Floor, Riazuddin Bazar
          Chittagong, Bangladesh
    Owner: Farhad Hossain | 01819-556677
=========================================
Invoice No : ${invoice.invoiceNumber}
Date & Time: ${formattedDate}
Branch     : ${invoice.shopName}
Customer   : ${invoice.customerName} (${invoice.customerType})
Phone      : ${invoice.customerPhone || 'N/A'}
-----------------------------------------
${items.map(it => {
  const name = lang === 'EN' ? it.productNameEn : lang === 'BN' ? it.productNameBn : `${it.productNameEn} / ${it.productNameBn}`;
  const qty = `${it.cartonsQuantity > 0 ? it.cartonsQuantity + 'Ctn ' : ''}${it.pcsQuantity > 0 ? it.pcsQuantity + 'Pc' : ''}`;
  return `${name}\n  [${it.companyName}] 1Ctn=${it.pcsPerCarton}Pc | Qty: ${qty} | Total: ৳${it.totalAmount}`;
}).join('\n')}
-----------------------------------------
Current Bill (বর্তমান বিল)    : ৳${invoice.currentBill}
Paid Now (${invoice.paymentMethod})       : ৳${invoice.paidNow}${invoice.transactionId ? ' (Trx: ' + invoice.transactionId + ')' : ''}
Due of this Bill (বিল বকেয়া) : ৳${invoice.billDue}
Previous Due (পূর্বের বকেয়া)  : ৳${invoice.previousDue}
=========================================
NET TOTAL DUE (মোট বকেয়া)    : ৳${invoice.netTotalDue}
=========================================
Thank you for visiting Toy Gallery!
    `;
    navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Controls Toolbar (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Invoice Preview / বিল রশিদ</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{invoice.invoiceNumber}</p>
          </div>

          {/* Format & Language Switchers */}
          <div className="flex items-center gap-2">
            {/* Format: 80mm POS Roll vs A4 */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setPrintFormat('POS_80MM')}
                className={`px-2 py-1 rounded-md transition ${printFormat === 'POS_80MM' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                POS 80mm
              </button>
              <button
                onClick={() => setPrintFormat('A4')}
                className={`px-2 py-1 rounded-md transition ${printFormat === 'A4' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                A4 Sheet
              </button>
            </div>

            {/* Language: EN / BN / BOTH */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setLang('EN')}
                className={`px-2 py-1 rounded-md ${lang === 'EN' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('BN')}
                className={`px-2 py-1 rounded-md ${lang === 'BN' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang('BOTH')}
                className={`px-2 py-1 rounded-md ${lang === 'BOTH' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Both
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          
          {printFormat === 'POS_80MM' ? (
            /* 80mm POS Thermal Receipt */
            <div className="print-pos-80mm bg-white p-4 w-full max-w-[340px] shadow-sm rounded-lg border border-slate-200 text-slate-900 font-sans text-xs">
              
              {/* Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-2">
                <h1 className="font-black text-lg tracking-wider text-slate-950">TOY GALLERY</h1>
                <p className="font-bold text-xs text-slate-700">টয় গ্যালারী (খেলনার জগত)</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-tight">
                  Jalsa Market 2nd Floor, Riazuddin Bazar, Chittagong
                </p>
                <p className="text-[10px] text-slate-500">
                  Proprietor: Farhad Hossain • 01819-556677
                </p>
              </div>

              {/* Meta */}
              <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2 mb-2">
                <div className="flex justify-between font-bold">
                  <span>Inv: {invoice.invoiceNumber}</span>
                  <span>{formattedDate}</span>
                </div>
                <div>Shop: <span className="font-semibold">{invoice.shopName}</span></div>
                <div className="font-semibold text-slate-900">
                  Customer: {invoice.customerName} <span className="text-[10px] bg-slate-100 px-1 py-0.2 rounded border">[{invoice.customerType}]</span>
                </div>
                {invoice.customerPhone && <div className="text-slate-600">Phone: {invoice.customerPhone}</div>}
              </div>

              {/* Items List */}
              <div className="border-b border-dashed border-slate-300 pb-2 mb-2">
                <div className="flex justify-between font-bold text-[11px] text-slate-950 border-b border-slate-200 pb-1 mb-1">
                  <span className="w-1/2">Item Description</span>
                  <span className="w-1/4 text-center">Qty</span>
                  <span className="w-1/4 text-right">Total TK</span>
                </div>

                <div className="space-y-1.5">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[11px]">
                      <div className="w-1/2 pr-1">
                        <div className="font-semibold text-slate-950 leading-tight">
                          {lang === 'EN' ? it.productNameEn : lang === 'BN' ? it.productNameBn : `${it.productNameEn} (${it.productNameBn})`}
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {it.companyName} • 1Ctn={it.pcsPerCarton}Pc
                        </div>
                      </div>
                      <div className="w-1/4 text-center text-slate-700 text-[10px] font-medium">
                        {it.cartonsQuantity > 0 && `${it.cartonsQuantity} Ctn `}
                        {it.pcsQuantity > 0 && `${it.pcsQuantity} Pc`}
                        {it.cartonsQuantity === 0 && it.pcsQuantity === 0 && `${it.totalPcs} Pc`}
                      </div>
                      <div className="w-1/4 text-right font-bold text-slate-950">
                        ৳{it.totalAmount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RUNNING DUE CALCULATION BREAKDOWN (Mandatory Core Feature) */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2 mb-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span>৳{invoice.currentBill + invoice.discount}</span>
                </div>

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount (ছাড়):</span>
                    <span>-৳{invoice.discount}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-slate-950 pt-0.5">
                  <span>Current Bill (বর্তমান বিল):</span>
                  <span>৳{invoice.currentBill}</span>
                </div>

                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>
                    Paid Now ({invoice.paymentMethod})
                    {invoice.bankName ? ` ${invoice.bankName}` : ''}:
                  </span>
                  <span>৳{invoice.paidNow}</span>
                </div>
                {invoice.transactionId && (
                  <div className="text-[9px] text-slate-500 pl-2">
                    Trx ID: {invoice.transactionId}
                  </div>
                )}

                <div className="flex justify-between text-slate-700">
                  <span>Due of this Bill (বিল বকেয়া):</span>
                  <span>৳{invoice.billDue}</span>
                </div>

                <div className="flex justify-between font-semibold text-rose-700">
                  <span>Previous Due (পূর্বের বকেয়া):</span>
                  <span>৳{invoice.previousDue}</span>
                </div>

                {/* NET TOTAL DUE HIGHLIGHT */}
                <div className="flex justify-between items-center bg-rose-50 border border-rose-300 px-2 py-1 rounded font-black text-rose-800 text-[12px] mt-1.5">
                  <span>NET TOTAL DUE (মোট বকেয়া):</span>
                  <span className="text-sm">৳{invoice.netTotalDue} TK</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-500 space-y-0.5 pt-1">
                <p className="font-semibold text-slate-700">খেলনা কেনার বিশ্বস্ত প্রতিষ্ঠান</p>
                <p>Thank You For Choosing Toy Gallery!</p>
                <p className="text-[9px]">Software: Toy Gallery POS • Chittagong</p>
              </div>

            </div>
          ) : (
            /* A4 Full Invoice Format */
            <div className="print-a4 bg-white p-6 sm:p-8 w-full max-w-[800px] shadow-sm rounded-lg border border-slate-200 text-slate-900 text-xs">
              
              {/* A4 Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                <div>
                  <h1 className="font-black text-2xl text-slate-950">TOY GALLERY</h1>
                  <p className="font-bold text-sm text-slate-700">টয় গ্যালারী - পাইকারী ও খুচরা খেলনা বিক্রয় কেন্দ্র</p>
                  <p className="text-xs text-slate-600 mt-1">Jalsa Market 2nd Floor, Riazuddin Bazar, Chittagong</p>
                  <p className="text-xs text-slate-600">Proprietor: Farhad Hossain • 01819-556677 • toyofficialgellary@gmail.com</p>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white font-bold px-3 py-1 rounded text-xs uppercase mb-1">
                    Tax / Retail Invoice
                  </div>
                  <div className="font-mono font-bold text-sm">{invoice.invoiceNumber}</div>
                  <div className="text-slate-600 text-[11px]">{formattedDate}</div>
                  <div className="text-slate-600 text-[11px]">Branch: {invoice.shopName}</div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 flex justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Bill To / ক্রেতার বিবরণ:</span>
                  <div className="font-bold text-sm text-slate-950">{invoice.customerName}</div>
                  <div className="text-slate-600">Type: <span className="font-semibold">{invoice.customerType}</span> {invoice.customerPhone ? `• Phone: ${invoice.customerPhone}` : ''}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Previous Ledger Due:</span>
                  <div className="font-bold text-sm text-rose-700">৳{invoice.previousDue} TK</div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse mb-4">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px] border-b border-slate-300">
                    <th className="py-2 px-2 w-8">#</th>
                    <th className="py-2 px-2">Description (পণ্য বিবরণ)</th>
                    <th className="py-2 px-2">Company</th>
                    <th className="py-2 px-2">Packing</th>
                    <th className="py-2 px-2 text-center">Quantity</th>
                    <th className="py-2 px-2 text-right">Rate</th>
                    <th className="py-2 px-2 text-right">Amount (TK)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-200 text-xs hover:bg-slate-50">
                      <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium">
                        {lang === 'EN' ? it.productNameEn : lang === 'BN' ? it.productNameBn : `${it.productNameEn} / ${it.productNameBn}`}
                      </td>
                      <td className="py-2 px-2 text-slate-600">{it.companyName}</td>
                      <td className="py-2 px-2 text-slate-600">1 Ctn = {it.pcsPerCarton} Pcs</td>
                      <td className="py-2 px-2 text-center font-semibold">
                        {it.cartonsQuantity > 0 && `${it.cartonsQuantity} Ctn `}
                        {it.pcsQuantity > 0 && `${it.pcsQuantity} Pc`}
                        {it.cartonsQuantity === 0 && it.pcsQuantity === 0 && `${it.totalPcs} Pc`}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-700">
                        {it.cartonsQuantity > 0 ? `৳${it.ratePerCarton}/ctn` : `৳${it.ratePerPc}/pc`}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-slate-950">৳{it.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Running Due Summary Box (Right Aligned) */}
              <div className="flex justify-end">
                <div className="w-72 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Current Bill (বর্তমান বিল):</span>
                    <span className="font-bold">৳{invoice.currentBill}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Paid Now ({invoice.paymentMethod}):</span>
                    <span>৳{invoice.paidNow}</span>
                  </div>
                  {invoice.transactionId && (
                    <div className="text-[10px] text-slate-500">Ref: {invoice.transactionId}</div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Due of this Bill:</span>
                    <span>৳{invoice.billDue}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>Previous Due (পূর্বের বকেয়া):</span>
                    <span>৳{invoice.previousDue}</span>
                  </div>
                  <div className="border-t border-slate-300 pt-1.5 flex justify-between font-black text-rose-800 text-sm">
                    <span>NET TOTAL DUE:</span>
                    <span>৳{invoice.netTotalDue} TK</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="no-print bg-white p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Print / POS Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
