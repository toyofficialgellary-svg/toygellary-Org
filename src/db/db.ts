import Dexie, { type Table } from 'dexie';

export interface Shop {
  id?: number;
  name: string;
  address: string;
  phone: string;
  isMain: boolean;
  isActive: boolean;
}

export interface Company {
  id?: number;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
}

export interface Product {
  id?: number;
  sku: string;
  nameEn: string;
  nameBn: string;
  companyId: number;
  companyName: string;
  category: string;
  pcsPerCarton: number; // e.g. 1 Carton = 50 Pcs
  purchasePriceCarton: number;
  purchasePricePc: number;
  sellingPriceCarton: number;
  sellingPricePc: number;
  lowStockThresholdCartons: number;
  description?: string;
}

export interface ShopStock {
  id?: number;
  shopId: number;
  productId: number;
  totalPcs: number; // ground truth
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  address: string;
  customerType: 'LOCAL' | 'OUTSIDE';
  currentDue: number; // Running Net Due balance
  notes?: string;
  createdAt: number;
}

export interface CustomerLedger {
  id?: number;
  customerId: number;
  date: number;
  type: 'INVOICE' | 'PAYMENT' | 'OPENING_DUE';
  reference: string;
  debit: number; // Bill amount
  credit: number; // Payment received
  balance: number; // Running Net Due after this entry
  notes?: string;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  shopId: number;
  shopName: string;
  shopAddress: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerType: string;
  date: number;
  totalItems: number;
  currentBill: number;
  discount: number;
  previousDue: number;
  totalDue: number; // previousDue + currentBill
  paidNow: number;
  paymentMethod: string; // Cash, Bank, bKash, Nagad, Rocket, Upay
  bankName?: string;
  transactionId?: string;
  billDue: number; // currentBill - paidNow
  netTotalDue: number; // totalDue - paidNow
  notes?: string;
}

export interface InvoiceItem {
  id?: number;
  invoiceId: number;
  productId: number;
  productNameEn: string;
  productNameBn: string;
  companyName: string;
  pcsPerCarton: number;
  cartonsQuantity: number;
  pcsQuantity: number;
  totalPcs: number;
  ratePerCarton: number;
  ratePerPc: number;
  totalAmount: number;
}

// Module 3: Purchase & Supplier
export interface Purchase {
  id?: number;
  purchaseNumber: string; // e.g. PUR-2026-001
  shopId: number;
  shopName: string;
  companyId: number;
  companyName: string;
  date: number;
  totalItems: number;
  totalAmount: number;
  previousDue: number;
  totalDue: number; // previousDue + totalAmount
  paidNow: number;
  dueAmount: number; // totalDue - paidNow
  paymentMethod: string; // Cash, Bank, bKash, Nagad
  bankName?: string;
  transactionId?: string;
  notes?: string;
}

export interface PurchaseItem {
  id?: number;
  purchaseId: number;
  productId: number;
  productNameEn: string;
  productNameBn: string;
  pcsPerCarton: number;
  cartonsQuantity: number;
  pcsQuantity: number;
  totalPcs: number;
  ratePerCarton: number;
  ratePerPc: number;
  totalAmount: number;
}

export interface PurchaseReturn {
  id?: number;
  returnNumber: string;
  purchaseId?: number;
  shopId: number;
  shopName: string;
  companyId: number;
  companyName: string;
  date: number;
  totalAmount: number;
  adjustmentType: 'DEDUCT_DUE' | 'CASH_REFUND';
  notes?: string;
}

export interface PurchaseReturnItem {
  id?: number;
  returnId: number;
  productId: number;
  productNameEn: string;
  productNameBn: string;
  pcsPerCarton: number;
  cartonsQuantity: number;
  pcsQuantity: number;
  totalPcs: number;
  ratePerCarton: number;
  ratePerPc: number;
  totalAmount: number;
}

export interface SupplierLedger {
  id?: number;
  companyId: number;
  date: number;
  type: 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'OPENING_DUE';
  reference: string;
  debit: number; // Paid / Returned (reduces supplier due)
  credit: number; // Bill amount (increases supplier due)
  balance: number; // Running due balance
  notes?: string;
}

// Module 3: Daily Accounts (Expenses, Incomes, Collections)
export interface DailyAccount {
  id?: number;
  shopId: number;
  shopName: string;
  date: number;
  type: 'EXPENSE' | 'INCOME' | 'CASH_COLLECTION' | 'BANK_MFS_COLLECTION';
  category: string;
  amount: number;
  paymentChannel: 'CASH' | 'BANK' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY';
  bankName?: string;
  branchName?: string;
  transactionId?: string;
  partyName?: string;
  customerId?: number;
  customerType?: 'LOCAL' | 'OUTSIDE';
  referenceNo?: string;
  notes?: string;
  recordedBy: string;
}

// Module 3: Staff Attendance & Salary
export interface Staff {
  id?: number;
  name: string;
  phone: string;
  role: 'Manager' | 'Salesman' | 'Staff' | 'Accountant' | 'Delivery';
  shopId: number;
  shopName: string;
  monthlySalary: number;
  dailyRate: number;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface StaffAttendance {
  id?: number;
  staffId: number;
  staffName: string;
  shopId: number;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  overtimeHours: number;
  notes?: string;
}

export interface StaffSalaryPayment {
  id?: number;
  staffId: number;
  staffName: string;
  month: string; // YYYY-MM
  amountPaid: number;
  type: 'SALARY' | 'ADVANCE';
  paymentDate: number;
  paymentMethod: string;
  notes?: string;
}

// Module 3: User Roles
export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'SALESMAN';

export interface UserAccount {
  id?: number;
  username: string;
  fullName: string;
  role: UserRole;
  shopId?: number; // undefined or 0 = All Shops
  pin: string;
  phone: string;
}

export interface SyncLog {
  id?: number;
  entity: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: number;
  timestamp: number;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export class ToyGalleryDexie extends Dexie {
  shops!: Table<Shop, number>;
  companies!: Table<Company, number>;
  products!: Table<Product, number>;
  stocks!: Table<ShopStock, number>;
  customers!: Table<Customer, number>;
  customerLedger!: Table<CustomerLedger, number>;
  invoices!: Table<Invoice, number>;
  invoiceItems!: Table<InvoiceItem, number>;
  purchases!: Table<Purchase, number>;
  purchaseItems!: Table<PurchaseItem, number>;
  purchaseReturns!: Table<PurchaseReturn, number>;
  purchaseReturnItems!: Table<PurchaseReturnItem, number>;
  supplierLedger!: Table<SupplierLedger, number>;
  dailyAccounts!: Table<DailyAccount, number>;
  staff!: Table<Staff, number>;
  staffAttendance!: Table<StaffAttendance, number>;
  staffSalaries!: Table<StaffSalaryPayment, number>;
  userAccounts!: Table<UserAccount, number>;
  syncLogs!: Table<SyncLog, number>;

  constructor() {
    super('ToyGalleryDB');
    this.version(2).stores({
      shops: '++id, name, isMain, isActive',
      companies: '++id, name',
      products: '++id, sku, nameEn, nameBn, companyId, companyName, category',
      stocks: '++id, [shopId+productId], shopId, productId',
      customers: '++id, name, phone, customerType, currentDue',
      customerLedger: '++id, customerId, date, type',
      invoices: '++id, invoiceNumber, customerId, shopId, date',
      invoiceItems: '++id, invoiceId, productId',
      purchases: '++id, purchaseNumber, companyId, shopId, date',
      purchaseItems: '++id, purchaseId, productId',
      purchaseReturns: '++id, returnNumber, companyId, shopId, date',
      purchaseReturnItems: '++id, returnId, productId',
      supplierLedger: '++id, companyId, date, type',
      dailyAccounts: '++id, shopId, date, type, category, paymentChannel',
      staff: '++id, name, shopId, role, status',
      staffAttendance: '++id, [staffId+date], staffId, shopId, date',
      staffSalaries: '++id, staffId, month, paymentDate',
      userAccounts: '++id, username, role',
      syncLogs: '++id, entity, timestamp, status'
    });
  }
}

export const db = new ToyGalleryDexie();

// Bangladeshi Banks List
export const BANGLADESH_BANKS = [
  "Dutch-Bangla Bank Ltd (DBBL)",
  "BRAC Bank",
  "The City Bank",
  "Islami Bank Bangladesh Ltd (IBBL)",
  "Sonali Bank",
  "Janata Bank",
  "Agrani Bank",
  "Pubali Bank",
  "Uttara Bank",
  "Prime Bank",
  "Eastern Bank Ltd (EBL)",
  "AB Bank",
  "Bank Asia",
  "Southeast Bank",
  "Dhaka Bank",
  "NCC Bank",
  "Mercantile Bank",
  "One Bank",
  "EXIM Bank",
  "Al-Arafah Islami Bank",
  "Shahjalal Islami Bank",
  "Social Islami Bank (SIBL)",
  "First Security Islami Bank (FSIBL)",
  "Standard Bank",
  "Rupali Bank",
  "United Commercial Bank (UCB)",
  "Premier Bank",
  "Mutual Trust Bank (MTB)",
  "Jamuna Bank",
  "Trust Bank",
  "National Bank",
  "Standard Chartered Bangladesh"
];

export const MFS_PROVIDERS = [
  "bKash",
  "Nagad",
  "Rocket (DBBL)",
  "Upay (UCB)"
];

export const ALL_BANKS_AND_MFS = [
  ...BANGLADESH_BANKS,
  ...MFS_PROVIDERS
];

// Seed initial Toy Gallery data
export async function seedInitialData() {
  const shopCount = await db.shops.count();
  if (shopCount > 0) return;

  // 1. Initial Shops
  const shop1Id = await db.shops.add({
    name: "Toy Gallery (Main Showroom)",
    address: "Jalsa Market 2nd Floor, Riazuddin Bazar, Chittagong",
    phone: "01819-556677",
    isMain: true,
    isActive: true
  });

  const shop2Id = await db.shops.add({
    name: "Toy Gallery (Branch 2)",
    address: "Terribazar Commercial Hub, Chittagong",
    phone: "01711-223344",
    isMain: false,
    isActive: true
  });

  const shop3Id = await db.shops.add({
    name: "Central Godown / Warehouse",
    address: "Khatunganj Wholesale Area, Chittagong",
    phone: "01912-889900",
    isMain: false,
    isActive: true
  });

  // 2. Initial Companies
  const comp1Id = await db.companies.add({
    name: "Aman Plastic Toy",
    contactPerson: "Md. Amanullah",
    phone: "01715-112233",
    address: "Kamrangirchar, Dhaka"
  });

  const comp2Id = await db.companies.add({
    name: "Jihan Toy Industries",
    contactPerson: "Engr. Jihan Ahmed",
    phone: "01814-445566",
    address: "Tongi Industrial Area, Gazipur"
  });

  const comp3Id = await db.companies.add({
    name: "Dhaka Toy Mart",
    contactPerson: "Haji Rafiqul Islam",
    phone: "01911-778899",
    address: "Chawkbazar, Old Dhaka"
  });

  const comp4Id = await db.companies.add({
    name: "China Imports Direct Chittagong",
    contactPerson: "Farhad Hossain (Owner)",
    phone: "01819-556677",
    address: "Agrabad C/A, Chittagong"
  });

  // 3. Initial Products with Bilingual Names & Carton / Pcs conversions
  const productsData: Omit<Product, 'id'>[] = [
    {
      sku: "TG-APT-01",
      nameEn: "Remote Control Super Racing Car",
      nameBn: "রিমোট কন্ট্রোল সুপার রেসিং কার",
      companyId: comp1Id,
      companyName: "Aman Plastic Toy",
      category: "Vehicles & RC",
      pcsPerCarton: 24,
      purchasePriceCarton: 9600,
      purchasePricePc: 400,
      sellingPriceCarton: 12000,
      sellingPricePc: 550,
      lowStockThresholdCartons: 5,
      description: "High speed rechargeable RC racing car with LED lights"
    },
    {
      sku: "TG-APT-02",
      nameEn: "Water Gun Blaster 500ml",
      nameBn: "ওয়াটার গান ব্লাস্টার ৫০০ মি.লি.",
      companyId: comp1Id,
      companyName: "Aman Plastic Toy",
      category: "Summer & Outdoor",
      pcsPerCarton: 50,
      purchasePriceCarton: 5500,
      purchasePricePc: 110,
      sellingPriceCarton: 7500,
      sellingPricePc: 160,
      lowStockThresholdCartons: 8,
      description: "High pressure water pump blaster"
    },
    {
      sku: "TG-JTI-01",
      nameEn: "Baby Walker Deluxe Musical",
      nameBn: "মিউজিক্যাল বেবি ওয়াকার ডিলাক্স",
      companyId: comp2Id,
      companyName: "Jihan Toy Industries",
      category: "Baby Gear & Walkers",
      pcsPerCarton: 6,
      purchasePriceCarton: 7200,
      purchasePricePc: 1200,
      sellingPriceCarton: 9600,
      sellingPricePc: 1750,
      lowStockThresholdCartons: 4,
      description: "Adjustable height walker with cheerful melodies"
    },
    {
      sku: "TG-JTI-02",
      nameEn: "Die-Cast Metal Model Cars (Set of 6)",
      nameBn: "ডাই-কাস্ট মেটাল কার সেট",
      companyId: comp2Id,
      companyName: "Jihan Toy Industries",
      category: "Die-Cast & Models",
      pcsPerCarton: 40,
      purchasePriceCarton: 11200,
      purchasePricePc: 280,
      sellingPriceCarton: 14400,
      sellingPricePc: 390,
      lowStockThresholdCartons: 6,
      description: "Heavy metal pull-back sports cars"
    },
    {
      sku: "TG-APT-03",
      nameEn: "Building Blocks 500 Pcs Bucket",
      nameBn: "বিল্ডিং ব্লক ৫০০ পিস সেট",
      companyId: comp1Id,
      companyName: "Aman Plastic Toy",
      category: "Educational & Blocks",
      pcsPerCarton: 12,
      purchasePriceCarton: 5400,
      purchasePricePc: 450,
      sellingPriceCarton: 7200,
      sellingPricePc: 650,
      lowStockThresholdCartons: 5,
      description: "Interlocking construction bricks"
    },
    {
      sku: "TG-JTI-03",
      nameEn: "Doctor Set Play Suitcase",
      nameBn: "ডক্টর প্লে সেট সুটকেস",
      companyId: comp2Id,
      companyName: "Jihan Toy Industries",
      category: "Roleplay & Pretend",
      pcsPerCarton: 48,
      purchasePriceCarton: 7200,
      purchasePricePc: 150,
      sellingPriceCarton: 9600,
      sellingPricePc: 220,
      lowStockThresholdCartons: 6,
      description: "Medical tools with stethoscope and syringe"
    },
    {
      sku: "TG-DTM-01",
      nameEn: "Talking Tom Interactive Plush",
      nameBn: "টকিং টম ইন্টারেক্টিভ খেলনা",
      companyId: comp3Id,
      companyName: "Dhaka Toy Mart",
      category: "Plush & Dolls",
      pcsPerCarton: 30,
      purchasePriceCarton: 8400,
      purchasePricePc: 280,
      sellingPriceCarton: 10800,
      sellingPricePc: 400,
      lowStockThresholdCartons: 5,
      description: "Voice recording and mimicking talking cat"
    },
    {
      sku: "TG-CID-01",
      nameEn: "Automatic Bubble Machine Gun",
      nameBn: "অটোমেটিক বাবল মেশিন গান",
      companyId: comp4Id,
      companyName: "China Imports Direct Chittagong",
      category: "Summer & Outdoor",
      pcsPerCarton: 60,
      purchasePriceCarton: 6600,
      purchasePricePc: 110,
      sellingPriceCarton: 9000,
      sellingPricePc: 165,
      lowStockThresholdCartons: 7,
      description: "Continuous electric bubble blower"
    }
  ];

  const productIds: number[] = [];
  for (const p of productsData) {
    const id = await db.products.add(p);
    productIds.push(id);
  }

  // 4. Initial Stocks in Active Shop (Main Showroom)
  // Product 1: 12 Ctns + 10 Pcs
  await db.stocks.add({ shopId: shop1Id, productId: productIds[0], totalPcs: 12 * 24 + 10 });
  // Product 2: 4 Ctns + 20 Pcs (Low stock! Threshold is 8 Ctns)
  await db.stocks.add({ shopId: shop1Id, productId: productIds[1], totalPcs: 4 * 50 + 20 });
  // Product 3: 2 Ctns + 1 Pc (Low stock! Threshold is 4 Ctns)
  await db.stocks.add({ shopId: shop1Id, productId: productIds[2], totalPcs: 2 * 6 + 1 });
  // Product 4: 15 Ctns + 5 Pcs
  await db.stocks.add({ shopId: shop1Id, productId: productIds[3], totalPcs: 15 * 40 + 5 });
  // Product 5: 10 Ctns + 4 Pcs
  await db.stocks.add({ shopId: shop1Id, productId: productIds[4], totalPcs: 10 * 12 + 4 });
  // Product 6: 8 Ctns + 12 Pcs
  await db.stocks.add({ shopId: shop1Id, productId: productIds[5], totalPcs: 8 * 48 + 12 });
  // Product 7: 3 Ctns + 8 Pcs (Low stock!)
  await db.stocks.add({ shopId: shop1Id, productId: productIds[6], totalPcs: 3 * 30 + 8 });
  // Product 8: 18 Ctns + 25 Pcs
  await db.stocks.add({ shopId: shop1Id, productId: productIds[7], totalPcs: 18 * 60 + 25 });

  // 5. Initial Customers with Previous Due (Matches prompt example!)
  const cust1Id = await db.customers.add({
    name: "Al-Madina Toy Store",
    phone: "01819-234567",
    address: "Anderkilla, Chittagong",
    customerType: "LOCAL",
    currentDue: 20000, // Exactly as in the prompt example!
    notes: "Wholesale retailer in Chittagong",
    createdAt: Date.now() - 86400000 * 3
  });

  const cust2Id = await db.customers.add({
    name: "Rahman Baby Corner",
    phone: "01711-987654",
    address: "Station Road, Feni",
    customerType: "OUTSIDE",
    currentDue: 45000,
    notes: "Outside buyer, delivery via parcel",
    createdAt: Date.now() - 86400000 * 5
  });

  const cust3Id = await db.customers.add({
    name: "Chittagong Kids Kingdom",
    phone: "01912-345678",
    address: "GEC Circle, Chittagong",
    customerType: "LOCAL",
    currentDue: 15000,
    notes: "Local retail buyer",
    createdAt: Date.now() - 86400000 * 2
  });

  const cust4Id = await db.customers.add({
    name: "Barisal Toy Palace",
    phone: "01611-456789",
    address: "Sadar Road, Barisal",
    customerType: "OUTSIDE",
    currentDue: 80000,
    notes: "Shipment via Sadarghat launch",
    createdAt: Date.now() - 86400000 * 7
  });

  // 6. Initial Ledger Entries
  const now = Date.now();
  await db.customerLedger.add({
    customerId: cust1Id,
    date: now - 86400000 * 3,
    type: "OPENING_DUE",
    reference: "Previous Balance",
    debit: 20000,
    credit: 0,
    balance: 20000,
    notes: "Opening running due carried forward"
  });

  await db.customerLedger.add({
    customerId: cust2Id,
    date: now - 86400000 * 5,
    type: "OPENING_DUE",
    reference: "Previous Balance",
    debit: 45000,
    credit: 0,
    balance: 45000,
    notes: "Invoice #TG-2026-0012 balance"
  });

  // 7. Initial Supplier Ledger & Due Balances (Module 3)
  await db.supplierLedger.add({
    companyId: comp1Id,
    date: now - 86400000 * 10,
    type: 'OPENING_DUE',
    reference: 'Previous Supplier Balance',
    debit: 0,
    credit: 120000,
    balance: 120000,
    notes: 'Outstanding bill for Aman Plastic Toy consignment'
  });

  await db.supplierLedger.add({
    companyId: comp2Id,
    date: now - 86400000 * 8,
    type: 'OPENING_DUE',
    reference: 'Previous Supplier Balance',
    debit: 0,
    credit: 65000,
    balance: 65000,
    notes: 'Outstanding bill for Jihan Toy Industries'
  });

  // 8. Initial Staff (Module 3)
  const staff1Id = await db.staff.add({
    name: "Farhad Hossain (Owner)",
    phone: "01819-556677",
    role: "Manager",
    shopId: shop1Id,
    shopName: "Toy Gallery (Main Showroom)",
    monthlySalary: 75000,
    dailyRate: 2500,
    joiningDate: "2020-01-01",
    status: "ACTIVE"
  });

  const staff2Id = await db.staff.add({
    name: "Khorshed Alam",
    phone: "01811-123456",
    role: "Manager",
    shopId: shop1Id,
    shopName: "Toy Gallery (Main Showroom)",
    monthlySalary: 35000,
    dailyRate: 1166,
    joiningDate: "2022-03-15",
    status: "ACTIVE"
  });

  const staff3Id = await db.staff.add({
    name: "Rakib Hasan",
    phone: "01822-234567",
    role: "Salesman",
    shopId: shop1Id,
    shopName: "Toy Gallery (Main Showroom)",
    monthlySalary: 20000,
    dailyRate: 666,
    joiningDate: "2023-06-01",
    status: "ACTIVE"
  });

  const staff4Id = await db.staff.add({
    name: "Nurul Absar",
    phone: "01833-345678",
    role: "Staff",
    shopId: shop3Id,
    shopName: "Central Godown / Warehouse",
    monthlySalary: 22000,
    dailyRate: 733,
    joiningDate: "2022-09-10",
    status: "ACTIVE"
  });

  const staff5Id = await db.staff.add({
    name: "Mohammad Yasin",
    phone: "01844-456789",
    role: "Salesman",
    shopId: shop2Id,
    shopName: "Toy Gallery (Branch 2)",
    monthlySalary: 18000,
    dailyRate: 600,
    joiningDate: "2024-01-15",
    status: "ACTIVE"
  });

  // 9. Initial Staff Attendance for Today
  const todayStr = new Date().toISOString().slice(0, 10);
  await db.staffAttendance.add({
    staffId: staff2Id,
    staffName: "Khorshed Alam",
    shopId: shop1Id,
    date: todayStr,
    status: "PRESENT",
    overtimeHours: 1,
    notes: "Opened shop at 9:00 AM"
  });
  await db.staffAttendance.add({
    staffId: staff3Id,
    staffName: "Rakib Hasan",
    shopId: shop1Id,
    date: todayStr,
    status: "PRESENT",
    overtimeHours: 0,
    notes: "Counter duty"
  });
  await db.staffAttendance.add({
    staffId: staff4Id,
    staffName: "Nurul Absar",
    shopId: shop3Id,
    date: todayStr,
    status: "PRESENT",
    overtimeHours: 2,
    notes: "Stock unload from Dhaka truck"
  });

  // 10. Initial Daily Accounts (Expenses, Incomes, Collections)
  await db.dailyAccounts.add({
    shopId: shop1Id,
    shopName: "Toy Gallery (Main Showroom)",
    date: now - 3600000 * 5,
    type: "EXPENSE",
    category: "Staff Food / Entertainment",
    amount: 850,
    paymentChannel: "CASH",
    partyName: "Riazuddin Bazar Tea & Snacks",
    notes: "Morning tea & lunch snacks for counter staff",
    recordedBy: "Khorshed Alam"
  });

  await db.dailyAccounts.add({
    shopId: shop1Id,
    shopName: "Toy Gallery (Main Showroom)",
    date: now - 3600000 * 20,
    type: "EXPENSE",
    category: "Electricity / Utility",
    amount: 4200,
    paymentChannel: "BKASH",
    transactionId: "BK-988219482",
    partyName: "BPDB Chittagong",
    notes: "Jalsa Market shop electricity bill",
    recordedBy: "Farhad Hossain"
  });

  await db.dailyAccounts.add({
    shopId: shop1Id,
    shopName: "Toy Gallery (Main Showroom)",
    date: now - 3600000 * 8,
    type: "CASH_COLLECTION",
    category: "Customer Due Collection",
    amount: 15000,
    paymentChannel: "CASH",
    partyName: "Al-Madina Toy Store",
    notes: "Collected cash at shop counter",
    recordedBy: "Rakib Hasan"
  });

  await db.dailyAccounts.add({
    shopId: shop1Id,
    shopName: "Toy Gallery (Main Showroom)",
    date: now - 3600000 * 2,
    type: "BANK_MFS_COLLECTION",
    category: "Customer Due Collection",
    amount: 25000,
    paymentChannel: "BKASH",
    transactionId: "TRX93847281B",
    partyName: "Rahman Baby Corner",
    notes: "Received via bKash merchant",
    recordedBy: "Khorshed Alam"
  });

  await db.dailyAccounts.add({
    shopId: shop1Id,
    shopName: "Toy Gallery (Main Showroom)",
    date: now - 3600000 * 40,
    type: "EXPENSE",
    category: "Transport / Coolie",
    amount: 1500,
    paymentChannel: "CASH",
    partyName: "Chittagong Station Coolie",
    notes: "Unloading carton from truck to godown",
    recordedBy: "Nurul Absar"
  });

  // 11. Initial User Accounts
  await db.userAccounts.add({
    username: "farhad",
    fullName: "Farhad Hossain (Owner)",
    role: "SUPER_ADMIN",
    shopId: undefined,
    pin: "1234",
    phone: "01819-556677"
  });

  await db.userAccounts.add({
    username: "khorshed",
    fullName: "Khorshed Alam",
    role: "MANAGER",
    shopId: shop1Id,
    pin: "2222",
    phone: "01811-123456"
  });

  await db.userAccounts.add({
    username: "rakib",
    fullName: "Rakib Hasan",
    role: "SALESMAN",
    shopId: shop1Id,
    pin: "3333",
    phone: "01822-234567"
  });
}

// Module 2 Core: Process Sale Invoice with Running Due Logic
export async function processSaleInvoice(params: {
  shop: Shop;
  customer: Customer;
  items: Array<{
    product: Product;
    cartons: number;
    loosePcs: number;
    ratePerCarton: number;
    ratePerPc: number;
    totalAmount: number;
  }>;
  discount: number;
  paidNow: number;
  paymentMethod: string;
  bankName?: string;
  transactionId?: string;
  notes?: string;
}): Promise<Invoice> {
  const { shop, customer, items, discount, paidNow, paymentMethod, bankName, transactionId, notes } = params;

  const subtotal = items.reduce((acc, it) => acc + it.totalAmount, 0);
  const currentBill = Math.max(0, subtotal - discount);
  const previousDue = customer.currentDue;
  const totalDue = previousDue + currentBill;
  const billDue = Math.max(0, currentBill - paidNow);
  const newNetDue = Math.max(0, totalDue - paidNow);

  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `TG-${dateStr}-${rand}`;

  return await db.transaction('rw', [db.invoices, db.invoiceItems, db.stocks, db.customers, db.customerLedger], async () => {
    // 1. Create Invoice
    const invoiceId = await db.invoices.add({
      invoiceNumber,
      shopId: shop.id!,
      shopName: shop.name,
      shopAddress: shop.address,
      customerId: customer.id!,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerType: customer.customerType,
      date: timestamp,
      totalItems: items.length,
      currentBill,
      discount,
      previousDue,
      totalDue,
      paidNow,
      paymentMethod,
      bankName: paymentMethod === 'Bank' ? bankName : undefined,
      transactionId,
      billDue,
      netTotalDue: newNetDue,
      notes
    });

    // 2. Add Invoice Items
    for (const it of items) {
      const totalPcs = (it.cartons * it.product.pcsPerCarton) + it.loosePcs;
      await db.invoiceItems.add({
        invoiceId,
        productId: it.product.id!,
        productNameEn: it.product.nameEn,
        productNameBn: it.product.nameBn,
        companyName: it.product.companyName,
        pcsPerCarton: it.product.pcsPerCarton,
        cartonsQuantity: it.cartons,
        pcsQuantity: it.loosePcs,
        totalPcs,
        ratePerCarton: it.ratePerCarton,
        ratePerPc: it.ratePerPc,
        totalAmount: it.totalAmount
      });

      // Deduct stock in the active shop
      const existingStock = await db.stocks.where({ shopId: shop.id!, productId: it.product.id! }).first();
      if (existingStock) {
        const remaining = Math.max(0, existingStock.totalPcs - totalPcs);
        await db.stocks.update(existingStock.id!, { totalPcs: remaining });
      }
    }

    // 3. Update Customer Net Due
    await db.customers.update(customer.id!, { currentDue: newNetDue });

    // 4. Update Customer Ledger
    let runningBal = previousDue;
    if (currentBill > 0) {
      runningBal += currentBill;
      await db.customerLedger.add({
        customerId: customer.id!,
        date: timestamp,
        type: 'INVOICE',
        reference: `Invoice #${invoiceNumber}`,
        debit: currentBill,
        credit: 0,
        balance: runningBal,
        notes: `Sale of ${items.length} items (${shop.name})`
      });
    }

    if (paidNow > 0) {
      runningBal -= paidNow;
      const ref = `Payment (${paymentMethod})${bankName ? ' - ' + bankName : ''}${transactionId ? ' Trx:' + transactionId : ''}`;
      await db.customerLedger.add({
        customerId: customer.id!,
        date: timestamp + 1,
        type: 'PAYMENT',
        reference: ref,
        debit: 0,
        credit: paidNow,
        balance: runningBal,
        notes: `Paid against Invoice #${invoiceNumber}`
      });
    }

    const saved = await db.invoices.get(invoiceId);
    return saved!;
  });
}

// Standalone Due Collection
export async function collectDuePayment(params: {
  customer: Customer;
  amount: number;
  paymentMethod: string;
  bankName?: string;
  transactionId?: string;
  notes?: string;
}): Promise<number> {
  const { customer, amount, paymentMethod, bankName, transactionId, notes } = params;
  const newDue = Math.max(0, customer.currentDue - amount);
  const timestamp = Date.now();

  await db.transaction('rw', [db.customers, db.customerLedger], async () => {
    await db.customers.update(customer.id!, { currentDue: newDue });
    const ref = `Due Collection (${paymentMethod})${bankName ? ' - ' + bankName : ''}${transactionId ? ' Trx:' + transactionId : ''}`;
    await db.customerLedger.add({
      customerId: customer.id!,
      date: timestamp,
      type: 'PAYMENT',
      reference: ref,
      debit: 0,
      credit: amount,
      balance: newDue,
      notes: notes || 'Manual Due Collection'
    });
  });

  return newDue;
}

// UTF-8 BOM CSV Export for Microsoft Excel (Bangla without corruption)
export function exportToCsvWithBom(filename: string, csvContent: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Module 3: Process Purchase from Supplier
export async function processPurchase(params: {
  shop: Shop;
  company: Company;
  items: Array<{
    product: Product;
    cartons: number;
    loosePcs: number;
    ratePerCarton: number;
    ratePerPc: number;
    totalAmount: number;
  }>;
  paidNow: number;
  paymentMethod: string;
  bankName?: string;
  transactionId?: string;
  notes?: string;
}): Promise<Purchase> {
  const { shop, company, items, paidNow, paymentMethod, bankName, transactionId, notes } = params;
  const totalAmount = items.reduce((acc, it) => acc + it.totalAmount, 0);

  // Get current supplier due from latest ledger entry
  const lastLedger = await db.supplierLedger.where('companyId').equals(company.id!).last();
  const previousDue = lastLedger ? lastLedger.balance : 0;
  const totalDue = previousDue + totalAmount;
  const dueAmount = Math.max(0, totalDue - paidNow);

  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const purchaseNumber = `PUR-${dateStr}-${rand}`;

  return await db.transaction('rw', [db.purchases, db.purchaseItems, db.stocks, db.supplierLedger, db.dailyAccounts], async () => {
    const purchaseId = await db.purchases.add({
      purchaseNumber,
      shopId: shop.id!,
      shopName: shop.name,
      companyId: company.id!,
      companyName: company.name,
      date: timestamp,
      totalItems: items.length,
      totalAmount,
      previousDue,
      totalDue,
      paidNow,
      dueAmount,
      paymentMethod,
      bankName: paymentMethod === 'Bank' ? bankName : undefined,
      transactionId,
      notes
    });

    for (const it of items) {
      const totalPcs = (it.cartons * it.product.pcsPerCarton) + it.loosePcs;
      await db.purchaseItems.add({
        purchaseId,
        productId: it.product.id!,
        productNameEn: it.product.nameEn,
        productNameBn: it.product.nameBn,
        pcsPerCarton: it.product.pcsPerCarton,
        cartonsQuantity: it.cartons,
        pcsQuantity: it.loosePcs,
        totalPcs,
        ratePerCarton: it.ratePerCarton,
        ratePerPc: it.ratePerPc,
        totalAmount: it.totalAmount
      });

      // Increase stock in the receiving shop
      const existingStock = await db.stocks.where({ shopId: shop.id!, productId: it.product.id! }).first();
      if (existingStock) {
        await db.stocks.update(existingStock.id!, { totalPcs: existingStock.totalPcs + totalPcs });
      } else {
        await db.stocks.add({ shopId: shop.id!, productId: it.product.id!, totalPcs });
      }
    }

    // Record in Supplier Ledger
    let runningBal = previousDue + totalAmount;
    await db.supplierLedger.add({
      companyId: company.id!,
      date: timestamp,
      type: 'PURCHASE',
      reference: `Bill #${purchaseNumber}`,
      debit: 0,
      credit: totalAmount,
      balance: runningBal,
      notes: `Stock Inward ${items.length} items to ${shop.name}`
    });

    if (paidNow > 0) {
      runningBal -= paidNow;
      await db.supplierLedger.add({
        companyId: company.id!,
        date: timestamp + 1,
        type: 'PAYMENT',
        reference: `Paid (${paymentMethod})${bankName ? ' - ' + bankName : ''}`,
        debit: paidNow,
        credit: 0,
        balance: runningBal,
        notes: `Paid against purchase #${purchaseNumber}`
      });

      // Also record in Daily Accounts expense if paid by Cash / Bank
      await db.dailyAccounts.add({
        shopId: shop.id!,
        shopName: shop.name,
        date: timestamp,
        type: 'EXPENSE',
        category: 'Purchase Payment',
        amount: paidNow,
        paymentChannel: paymentMethod.toUpperCase().includes('BANK') ? 'BANK' : paymentMethod.toUpperCase().includes('BKASH') ? 'BKASH' : 'CASH',
        bankName,
        transactionId,
        partyName: company.name,
        referenceNo: purchaseNumber,
        notes: `Paid supplier ${company.name} on purchase`,
        recordedBy: 'Farhad Hossain'
      });
    }

    const saved = await db.purchases.get(purchaseId);
    return saved!;
  });
}

// Module 3: Process Purchase Return to Supplier
export async function processPurchaseReturn(params: {
  shop: Shop;
  company: Company;
  items: Array<{
    product: Product;
    cartons: number;
    loosePcs: number;
    ratePerCarton: number;
    ratePerPc: number;
    totalAmount: number;
  }>;
  adjustmentType: 'DEDUCT_DUE' | 'CASH_REFUND';
  notes?: string;
}): Promise<PurchaseReturn> {
  const { shop, company, items, adjustmentType, notes } = params;
  const totalAmount = items.reduce((acc, it) => acc + it.totalAmount, 0);

  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const returnNumber = `PRET-${dateStr}-${rand}`;

  return await db.transaction('rw', [db.purchaseReturns, db.purchaseReturnItems, db.stocks, db.supplierLedger, db.dailyAccounts], async () => {
    const returnId = await db.purchaseReturns.add({
      returnNumber,
      shopId: shop.id!,
      shopName: shop.name,
      companyId: company.id!,
      companyName: company.name,
      date: timestamp,
      totalAmount,
      adjustmentType,
      notes
    });

    for (const it of items) {
      const totalPcs = (it.cartons * it.product.pcsPerCarton) + it.loosePcs;
      await db.purchaseReturnItems.add({
        returnId,
        productId: it.product.id!,
        productNameEn: it.product.nameEn,
        productNameBn: it.product.nameBn,
        pcsPerCarton: it.product.pcsPerCarton,
        cartonsQuantity: it.cartons,
        pcsQuantity: it.loosePcs,
        totalPcs,
        ratePerCarton: it.ratePerCarton,
        ratePerPc: it.ratePerPc,
        totalAmount: it.totalAmount
      });

      // Deduct returned stock from shop
      const existingStock = await db.stocks.where({ shopId: shop.id!, productId: it.product.id! }).first();
      if (existingStock) {
        const remaining = Math.max(0, existingStock.totalPcs - totalPcs);
        await db.stocks.update(existingStock.id!, { totalPcs: remaining });
      }
    }

    // Update Supplier Ledger
    const lastLedger = await db.supplierLedger.where('companyId').equals(company.id!).last();
    const prevBal = lastLedger ? lastLedger.balance : 0;
    const newBal = Math.max(0, prevBal - totalAmount);

    await db.supplierLedger.add({
      companyId: company.id!,
      date: timestamp,
      type: 'RETURN',
      reference: `Return #${returnNumber}`,
      debit: totalAmount,
      credit: 0,
      balance: newBal,
      notes: `Returned damaged/unsold goods from ${shop.name} (${adjustmentType === 'DEDUCT_DUE' ? 'Deducted from Due' : 'Cash Refund'})`
    });

    if (adjustmentType === 'CASH_REFUND') {
      await db.dailyAccounts.add({
        shopId: shop.id!,
        shopName: shop.name,
        date: timestamp,
        type: 'INCOME',
        category: 'Purchase Return Refund',
        amount: totalAmount,
        paymentChannel: 'CASH',
        partyName: company.name,
        referenceNo: returnNumber,
        notes: `Cash refund from supplier for return #${returnNumber}`,
        recordedBy: 'Farhad Hossain'
      });
    }

    const saved = await db.purchaseReturns.get(returnId);
    return saved!;
  });
}

// Module 3: Pay Supplier Due
export async function paySupplierDue(params: {
  company: Company;
  shop: Shop;
  amount: number;
  paymentMethod: string;
  bankName?: string;
  transactionId?: string;
  notes?: string;
}): Promise<number> {
  const { company, shop, amount, paymentMethod, bankName, transactionId, notes } = params;
  const lastLedger = await db.supplierLedger.where('companyId').equals(company.id!).last();
  const currentDue = lastLedger ? lastLedger.balance : 0;
  const newDue = Math.max(0, currentDue - amount);
  const timestamp = Date.now();

  await db.transaction('rw', [db.supplierLedger, db.dailyAccounts], async () => {
    const ref = `Payment (${paymentMethod})${bankName ? ' - ' + bankName : ''}${transactionId ? ' Trx:' + transactionId : ''}`;
    await db.supplierLedger.add({
      companyId: company.id!,
      date: timestamp,
      type: 'PAYMENT',
      reference: ref,
      debit: amount,
      credit: 0,
      balance: newDue,
      notes: notes || 'Supplier Due Clearance'
    });

    await db.dailyAccounts.add({
      shopId: shop.id!,
      shopName: shop.name,
      date: timestamp,
      type: 'EXPENSE',
      category: 'Supplier Due Payment',
      amount,
      paymentChannel: paymentMethod.toUpperCase().includes('BANK') ? 'BANK' : paymentMethod.toUpperCase().includes('BKASH') ? 'BKASH' : 'CASH',
      bankName,
      transactionId,
      partyName: company.name,
      notes: `Supplier due payment to ${company.name}`,
      recordedBy: 'Farhad Hossain'
    });
  });

  return newDue;
}

// Export Full Database to JSON file for Offline Backup
export async function exportFullBackupJson(): Promise<string> {
  const backupData = {
    appName: "Toy Gallery POS & Business Management",
    owner: "Farhad Hossain",
    location: "Chittagong",
    version: "2.0.0",
    exportDate: new Date().toISOString(),
    timestamp: Date.now(),
    shops: await db.shops.toArray(),
    companies: await db.companies.toArray(),
    products: await db.products.toArray(),
    stocks: await db.stocks.toArray(),
    customers: await db.customers.toArray(),
    customerLedger: await db.customerLedger.toArray(),
    invoices: await db.invoices.toArray(),
    invoiceItems: await db.invoiceItems.toArray(),
    purchases: await db.purchases.toArray(),
    purchaseItems: await db.purchaseItems.toArray(),
    purchaseReturns: await db.purchaseReturns.toArray(),
    purchaseReturnItems: await db.purchaseReturnItems.toArray(),
    supplierLedger: await db.supplierLedger.toArray(),
    dailyAccounts: await db.dailyAccounts.toArray(),
    staff: await db.staff.toArray(),
    staffAttendance: await db.staffAttendance.toArray(),
    staffSalaries: await db.staffSalaries.toArray(),
    userAccounts: await db.userAccounts.toArray()
  };

  return JSON.stringify(backupData, null, 2);
}

// Restore Full Database from JSON
export async function restoreFullBackupJson(jsonString: string): Promise<{ success: boolean; stats: any; message?: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.products || !data.shops || !data.companies) {
      return { success: false, stats: null, message: "Invalid backup format. Missing core tables." };
    }

    await db.transaction('rw', [
      db.shops, db.companies, db.products, db.stocks, db.customers, db.customerLedger,
      db.invoices, db.invoiceItems, db.purchases, db.purchaseItems, db.purchaseReturns,
      db.purchaseReturnItems, db.supplierLedger, db.dailyAccounts, db.staff,
      db.staffAttendance, db.staffSalaries, db.userAccounts
    ], async () => {
      // Clear existing
      await db.shops.clear();
      await db.companies.clear();
      await db.products.clear();
      await db.stocks.clear();
      await db.customers.clear();
      await db.customerLedger.clear();
      await db.invoices.clear();
      await db.invoiceItems.clear();
      await db.purchases.clear();
      await db.purchaseItems.clear();
      await db.purchaseReturns.clear();
      await db.purchaseReturnItems.clear();
      await db.supplierLedger.clear();
      await db.dailyAccounts.clear();
      await db.staff.clear();
      await db.staffAttendance.clear();
      await db.staffSalaries.clear();
      await db.userAccounts.clear();

      // Bulk re-insert
      if (data.shops?.length) await db.shops.bulkAdd(data.shops);
      if (data.companies?.length) await db.companies.bulkAdd(data.companies);
      if (data.products?.length) await db.products.bulkAdd(data.products);
      if (data.stocks?.length) await db.stocks.bulkAdd(data.stocks);
      if (data.customers?.length) await db.customers.bulkAdd(data.customers);
      if (data.customerLedger?.length) await db.customerLedger.bulkAdd(data.customerLedger);
      if (data.invoices?.length) await db.invoices.bulkAdd(data.invoices);
      if (data.invoiceItems?.length) await db.invoiceItems.bulkAdd(data.invoiceItems);
      if (data.purchases?.length) await db.purchases.bulkAdd(data.purchases);
      if (data.purchaseItems?.length) await db.purchaseItems.bulkAdd(data.purchaseItems);
      if (data.purchaseReturns?.length) await db.purchaseReturns.bulkAdd(data.purchaseReturns);
      if (data.purchaseReturnItems?.length) await db.purchaseReturnItems.bulkAdd(data.purchaseReturnItems);
      if (data.supplierLedger?.length) await db.supplierLedger.bulkAdd(data.supplierLedger);
      if (data.dailyAccounts?.length) await db.dailyAccounts.bulkAdd(data.dailyAccounts);
      if (data.staff?.length) await db.staff.bulkAdd(data.staff);
      if (data.staffAttendance?.length) await db.staffAttendance.bulkAdd(data.staffAttendance);
      if (data.staffSalaries?.length) await db.staffSalaries.bulkAdd(data.staffSalaries);
      if (data.userAccounts?.length) await db.userAccounts.bulkAdd(data.userAccounts);
    });

    const stats = {
      shops: data.shops?.length || 0,
      products: data.products?.length || 0,
      invoices: data.invoices?.length || 0,
      customers: data.customers?.length || 0,
      purchases: data.purchases?.length || 0,
      staff: data.staff?.length || 0
    };

    return { success: true, stats };
  } catch (err: any) {
    return { success: false, stats: null, message: err?.message || "Failed to parse JSON backup file" };
  }
}
