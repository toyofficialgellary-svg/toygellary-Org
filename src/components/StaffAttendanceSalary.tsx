import React, { useState, useEffect } from 'react';
import { 
  db, 
  Shop, 
  Staff, 
  StaffAttendance, 
  StaffSalaryPayment, 
  exportToCsvWithBom 
} from '../db/db';
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  Check, 
  X, 
  Clock, 
  Plus, 
  DollarSign, 
  Download, 
  FileText 
} from 'lucide-react';

interface StaffAttendanceSalaryProps {
  shops: Shop[];
  activeShop: Shop;
  onRefresh: () => void;
}

export function StaffAttendanceSalary({
  shops,
  activeShop,
  onRefresh
}: StaffAttendanceSalaryProps) {
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'SALARY_SHEET' | 'STAFF_LIST'>('ATTENDANCE');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, StaffAttendance>>({});
  const [salaryPayments, setSalaryPayments] = useState<StaffSalaryPayment[]>([]);

  // Add Staff Modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Manager' | 'Salesman' | 'Staff' | 'Accountant' | 'Delivery'>('Salesman');
  const [newStaffShopId, setNewStaffShopId] = useState<number>(activeShop.id || 0);
  const [newStaffSalary, setNewStaffSalary] = useState<number>(20000);

  // Pay Salary / Advance Modal
  const [showPayModal, setShowPayModal] = useState<Staff | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payType, setPayType] = useState<'SALARY' | 'ADVANCE'>('SALARY');
  const [payMonth, setPayMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [payMethod, setPayMethod] = useState<string>('Cash');
  const [payNotes, setPayNotes] = useState<string>('');

  const loadStaffData = async () => {
    const list = await db.staff.toArray();
    setStaffList(list);

    // Load attendance for selected date
    const attList = await db.staffAttendance.where('date').equals(selectedDate).toArray();
    const attMap: Record<number, StaffAttendance> = {};
    attList.forEach(a => {
      attMap[a.staffId] = a;
    });
    setAttendanceRecords(attMap);

    const payments = await db.staffSalaries.toArray();
    setSalaryPayments(payments.sort((a, b) => b.paymentDate - a.paymentDate));
  };

  useEffect(() => {
    loadStaffData();
  }, [selectedDate, activeTab]);

  // Mark Attendance status
  const handleMarkStatus = async (staff: Staff, status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE') => {
    const existing = attendanceRecords[staff.id!];
    if (existing?.id) {
      await db.staffAttendance.update(existing.id, { status });
    } else {
      await db.staffAttendance.add({
        staffId: staff.id!,
        staffName: staff.name,
        shopId: staff.shopId,
        date: selectedDate,
        status,
        overtimeHours: 0
      });
    }
    loadStaffData();
  };

  // Mark All Present
  const handleMarkAllPresent = async () => {
    for (const staff of staffList) {
      const existing = attendanceRecords[staff.id!];
      if (existing?.id) {
        await db.staffAttendance.update(existing.id, { status: 'PRESENT' });
      } else {
        await db.staffAttendance.add({
          staffId: staff.id!,
          staffName: staff.name,
          shopId: staff.shopId,
          date: selectedDate,
          status: 'PRESENT',
          overtimeHours: 0
        });
      }
    }
    loadStaffData();
  };

  // Add new staff member
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const shop = shops.find(s => s.id === newStaffShopId) || activeShop;
    const dailyRate = Math.round(newStaffSalary / 30);

    await db.staff.add({
      name: newStaffName.trim(),
      phone: newStaffPhone.trim(),
      role: newStaffRole,
      shopId: shop.id!,
      shopName: shop.name,
      monthlySalary: Number(newStaffSalary),
      dailyRate,
      joiningDate: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE'
    });

    setNewStaffName('');
    setNewStaffPhone('');
    setShowAddStaffModal(false);
    loadStaffData();
    onRefresh();
  };

  // Pay Salary / Advance
  const handlePaySalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal || payAmount <= 0) return;

    await db.staffSalaries.add({
      staffId: showPayModal.id!,
      staffName: showPayModal.name,
      month: payMonth,
      amountPaid: Number(payAmount),
      type: payType,
      paymentDate: Date.now(),
      paymentMethod: payMethod,
      notes: payNotes.trim() || undefined
    });

    // Also record into Daily Accounts as expense
    await db.dailyAccounts.add({
      shopId: showPayModal.shopId,
      shopName: showPayModal.shopName,
      date: Date.now(),
      type: 'EXPENSE',
      category: payType === 'ADVANCE' ? 'Staff Advance Salary' : 'Staff Monthly Salary',
      amount: Number(payAmount),
      paymentChannel: payMethod.toUpperCase().includes('BANK') ? 'BANK' : payMethod.toUpperCase().includes('BKASH') ? 'BKASH' : 'CASH',
      partyName: showPayModal.name,
      notes: `${payType} payment for ${payMonth}`,
      recordedBy: 'Farhad Hossain'
    });

    alert(`✅ Recorded ${payAmount.toLocaleString()} TK ${payType} payment for ${showPayModal.name}.`);
    setShowPayModal(null);
    setPayAmount(0);
    setPayNotes('');
    loadStaffData();
    onRefresh();
  };

  // Export Staff Attendance / Payroll to Excel
  const handleExportPayroll = () => {
    let csv = `Staff Name,Role,Shop,Monthly Salary (TK),Daily Rate (TK),Total Advances (TK),Total Salary Paid (TK)\n`;
    staffList.forEach(staff => {
      const adv = salaryPayments
        .filter(p => p.staffId === staff.id && p.type === 'ADVANCE')
        .reduce((sum, p) => sum + p.amountPaid, 0);
      const sal = salaryPayments
        .filter(p => p.staffId === staff.id && p.type === 'SALARY')
        .reduce((sum, p) => sum + p.amountPaid, 0);

      csv += `"${staff.name}","${staff.role}","${staff.shopName}","${staff.monthlySalary}","${staff.dailyRate}","${adv}","${sal}"\n`;
    });

    exportToCsvWithBom(`Toy_Gallery_Staff_Payroll.csv`, csv);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4 text-xs">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
              activeTab === 'ATTENDANCE'
                ? 'bg-slate-900 text-amber-400'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Daily Attendance / হাজিরা খাতা</span>
          </button>

          <button
            onClick={() => setActiveTab('SALARY_SHEET')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
              activeTab === 'SALARY_SHEET'
                ? 'bg-slate-900 text-amber-400'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Salary & Advance Sheet / বেতন ও অগ্রিম</span>
          </button>

          <button
            onClick={() => setActiveTab('STAFF_LIST')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
              activeTab === 'STAFF_LIST'
                ? 'bg-slate-900 text-amber-400'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff Directory / কর্মচারী তালিকা</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl font-bold shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff / নতুন কর্মচারী</span>
          </button>

          <button
            onClick={handleExportPayroll}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* 1. DAILY ATTENDANCE TAB */}
      {activeTab === 'ATTENDANCE' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
              />
            </div>

            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Mark All Present / সবাইকে উপস্থিত করুন</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Shop Assigned</th>
                  <th className="p-3">Monthly Salary</th>
                  <th className="p-3 text-center">Current Status</th>
                  <th className="p-3 text-center">Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map(staff => {
                  const att = attendanceRecords[staff.id!];
                  const status = att?.status || 'ABSENT';

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        {staff.name}
                        <span className="text-[10px] text-slate-500 block">{staff.phone}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {staff.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{staff.shopName}</td>
                      <td className="p-3 font-bold text-slate-900">{staff.monthlySalary.toLocaleString()} TK</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          status === 'HALF_DAY' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          status === 'LEAVE' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                          'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(staff, 'PRESENT')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              status === 'PRESENT' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(staff, 'HALF_DAY')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              status === 'HALF_DAY' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            Half Day
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(staff, 'LEAVE')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              status === 'LEAVE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            Leave
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(staff, 'ABSENT')}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              status === 'ABSENT' ? 'bg-rose-700 text-white' : 'bg-slate-100 text-rose-700 hover:bg-rose-50'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SALARY & ADVANCE SHEET TAB */}
      {activeTab === 'SALARY_SHEET' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {staffList.map(staff => {
              const currentMonth = new Date().toISOString().slice(0, 7);
              const paymentsForStaff = salaryPayments.filter(p => p.staffId === staff.id && p.month === currentMonth);
              const totalAdvance = paymentsForStaff.filter(p => p.type === 'ADVANCE').reduce((s, p) => s + p.amountPaid, 0);
              const totalSalaryPaid = paymentsForStaff.filter(p => p.type === 'SALARY').reduce((s, p) => s + p.amountPaid, 0);
              const netPayable = Math.max(0, staff.monthlySalary - totalAdvance - totalSalaryPaid);

              return (
                <div key={staff.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{staff.name}</h4>
                      <p className="text-[10px] text-slate-500">{staff.role} • {staff.shopName}</p>
                    </div>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                      {staff.monthlySalary.toLocaleString()} TK / mo
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Base Salary:</span>
                      <span className="font-bold text-slate-900">{staff.monthlySalary.toLocaleString()} TK</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Advance Taken ({currentMonth}):</span>
                      <span className="font-bold text-amber-700">-{totalAdvance.toLocaleString()} TK</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Salary Paid ({currentMonth}):</span>
                      <span className="font-bold text-emerald-700">-{totalSalaryPaid.toLocaleString()} TK</span>
                    </div>
                    <div className="pt-1.5 border-t flex justify-between font-black">
                      <span>Net Remaining Payable:</span>
                      <span className="text-sm text-rose-700">{netPayable.toLocaleString()} TK</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPayModal(staff);
                        setPayType('ADVANCE');
                        setPayAmount(2000);
                      }}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                    >
                      Give Advance / অগ্রিম
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowPayModal(staff);
                        setPayType('SALARY');
                        setPayAmount(netPayable);
                      }}
                      className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-lg font-bold"
                    >
                      Pay Salary / বেতন দিন
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Salary payment history table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
              Salary & Advance Payment Vouchers ({salaryPayments.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3 text-right">Amount (TK)</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaryPayments.map((pay, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-600">{new Date(pay.paymentDate).toLocaleDateString('en-GB')}</td>
                      <td className="p-3 font-bold text-slate-900">{pay.staffName}</td>
                      <td className="p-3 font-bold text-slate-700">{pay.month}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pay.type === 'ADVANCE' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {pay.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{pay.paymentMethod}</td>
                      <td className="p-3 text-right font-black text-slate-900">{pay.amountPaid.toLocaleString()} TK</td>
                      <td className="p-3 text-slate-500">{pay.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. STAFF DIRECTORY TAB */}
      {activeTab === 'STAFF_LIST' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Designation / Role</th>
                  <th className="p-3">Assigned Shop</th>
                  <th className="p-3 text-right">Monthly Salary (TK)</th>
                  <th className="p-3 text-right">Daily Rate (TK)</th>
                  <th className="p-3">Joining Date</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map(staff => (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{staff.name}</td>
                    <td className="p-3 text-slate-700 font-mono">{staff.phone}</td>
                    <td className="p-3 font-bold text-slate-800">{staff.role}</td>
                    <td className="p-3 text-slate-700">{staff.shopName}</td>
                    <td className="p-3 text-right font-black text-emerald-800">{staff.monthlySalary.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-700">{staff.dailyRate.toLocaleString()}</td>
                    <td className="p-3 text-slate-500">{staff.joiningDate}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {staff.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900 space-y-3">
            <h3 className="font-black text-base">Add New Staff / কর্মচারী যোগ করুন</h3>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3">
              <div>
                <label className="font-bold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Kamal Uddin"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="018XXXXXXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Role / পদবি:</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Salesman">Salesman</option>
                    <option value="Staff">Warehouse Staff</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Delivery">Delivery Boy</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Shop Assigned:</label>
                  <select
                    value={newStaffShopId}
                    onChange={(e) => setNewStaffShopId(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {shops.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Monthly Salary (TK) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={newStaffSalary || ''}
                  onChange={(e) => setNewStaffSalary(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-emerald-800 text-base outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-1.5 bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary / Advance Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-slate-900 space-y-3">
            <h3 className="font-black text-base">
              {payType === 'ADVANCE' ? 'Advance Payment / অগ্রিম প্রদান' : 'Salary Payout / বেতন পরিশোধ'}
            </h3>
            <p className="text-slate-500 font-bold">{showPayModal.name} ({showPayModal.role})</p>

            <form onSubmit={handlePaySalarySubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Payment Type:</label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="SALARY">Full/Partial Salary</option>
                    <option value="ADVANCE">Advance Salary</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Month:</label>
                  <input
                    type="month"
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Amount (TK) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-emerald-800 text-base outline-none"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Payment Method:</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="Cash">Cash</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Notes / Voucher Details:</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid in cash at shop counter"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="px-3 py-1.5 bg-slate-100 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
