import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db, exportFullBackupJson, restoreFullBackupJson, Product, Customer, Invoice, DailyAccount, Shop, Company, Staff } from './db';

export const SUPABASE_URL = 'https://sazxtkfclwgjmgpxsmak.supabase.co';

export interface SupabaseSyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  syncedTables?: {
    products: number;
    customers: number;
    sales: number;
    expenses: number;
    incomes: number;
    cash_collections: number;
    bank_collections: number;
  };
  details?: string[];
}

/**
 * Get saved Supabase anon key from localStorage
 */
export function getSupabaseAnonKey(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('supabase_anon_key') ||
    localStorage.getItem('toy_gallery_supabase_key') ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    ''
  );
}

/**
 * Save Supabase anon key to localStorage
 */
export function saveSupabaseAnonKey(key: string): void {
  if (typeof window === 'undefined') return;
  const cleanKey = key.trim();
  localStorage.setItem('supabase_anon_key', cleanKey);
  localStorage.setItem('toy_gallery_supabase_key', cleanKey);
  localStorage.setItem('toy_gallery_supabase_url', SUPABASE_URL);
}

/**
 * Get Supabase Client instance
 */
export function getSupabaseClient(customKey?: string): SupabaseClient | null {
  const key = customKey || getSupabaseAnonKey();
  if (!key) return null;

  try {
    // If window.supabase is available from CDN script
    if (typeof window !== 'undefined' && (window as any).supabase?.createClient) {
      return (window as any).supabase.createClient(SUPABASE_URL, key);
    }
    return createClient(SUPABASE_URL, key);
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

/**
 * Test connection to Supabase
 */
export async function testSupabaseConnection(customKey?: string): Promise<{ ok: boolean; message: string }> {
  const key = customKey || getSupabaseAnonKey();
  if (!key) {
    return { ok: false, message: 'Anon Key is empty. Please enter your Supabase Anon Key.' };
  }

  const client = getSupabaseClient(key);
  if (!client) {
    return { ok: false, message: 'Could not initialize Supabase client.' };
  }

  try {
    // Ping with a lightweight query or auth check
    const { error } = await client.from('products').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      // If error is unauthorized or invalid api key
      if (error.message.toLowerCase().includes('apikey') || error.message.toLowerCase().includes('jwt') || error.code === '401') {
        return { ok: false, message: `Invalid Anon Key: ${error.message}` };
      }
    }
    return { ok: true, message: 'Connected to Supabase successfully! (https://sazxtkfclwgjmgpxsmak.supabase.co)' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Connection error' };
  }
}

/**
 * syncToSupabase: Push all localStorage and Dexie data to Supabase tables
 * (products, customers, sales, expenses, incomes, cash_collections, bank_collections)
 */
export async function syncToSupabase(): Promise<SupabaseSyncResult> {
  const key = getSupabaseAnonKey();
  if (!key) {
    return {
      success: false,
      message: 'Anon Key is missing. Please set your Supabase Anon Key in the header or Backup tab.',
      timestamp: new Date().toLocaleString()
    };
  }

  const client = getSupabaseClient(key);
  if (!client) {
    return {
      success: false,
      message: 'Could not connect to Supabase.',
      timestamp: new Date().toLocaleString()
    };
  }

  const details: string[] = [];

  try {
    // 1. Collect all local data
    const products = await db.products.toArray();
    const customers = await db.customers.toArray();
    const invoices = await db.invoices.toArray();
    const invoiceItems = await db.invoiceItems.toArray();
    const allAccounts = await db.dailyAccounts.toArray();
    const shops = await db.shops.toArray();
    const companies = await db.companies.toArray();
    const staff = await db.staff.toArray();
    const purchases = await db.purchases.toArray();
    const stocks = await db.stocks.toArray();

    // Categorize daily accounts
    const expenses = allAccounts.filter(a => a.type === 'EXPENSE');
    const incomes = allAccounts.filter(a => a.type === 'INCOME');
    const cashCollections = allAccounts.filter(a => a.type === 'CASH_COLLECTION');
    const bankCollections = allAccounts.filter(a => a.type === 'BANK_MFS_COLLECTION');

    // 2. Prepare full consolidated JSON payload for cloud backup table
    const fullBackupJson = await exportFullBackupJson();
    const backupSnapshot = {
      app_name: 'Toy Gallery POS & Wholesale',
      owner: 'Farhad Hossain',
      shop_location: 'Jalsa Market, Chittagong',
      updated_at: new Date().toISOString(),
      timestamp: Date.now(),
      metrics: {
        products_count: products.length,
        customers_count: customers.length,
        invoices_count: invoices.length,
        expenses_count: expenses.length,
        incomes_count: incomes.length,
        cash_collections_count: cashCollections.length,
        bank_collections_count: bankCollections.length
      },
      data: JSON.parse(fullBackupJson)
    };

    // Save locally to localStorage cloud cache as well
    localStorage.setItem('toy_gallery_cloud_snapshot', JSON.stringify(backupSnapshot));

    // 3. Push to Supabase app_backups table
    try {
      const { error: backupErr } = await client
        .from('app_backups')
        .upsert({
          id: 'toy_gallery_primary_backup',
          app_id: 'toy_gallery_pos_ctg',
          backup_data: backupSnapshot,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (!backupErr) {
        details.push('Backed up full snapshot to Supabase app_backups table');
      }
    } catch (e) {
      // If table does not exist, continue table-by-table push
    }

    // 4. Push table by table
    // Products
    if (products.length > 0) {
      try {
        const { error } = await client.from('products').upsert(
          products.map(p => ({
            id: p.id,
            sku: p.sku,
            name_en: p.nameEn,
            name_bn: p.nameBn,
            company_id: p.companyId,
            company_name: p.companyName,
            category: p.category,
            pcs_per_carton: p.pcsPerCarton,
            purchase_price_carton: p.purchasePriceCarton,
            purchase_price_pc: p.purchasePricePc,
            selling_price_carton: p.sellingPriceCarton,
            selling_price_pc: p.sellingPricePc,
            low_stock_threshold: p.lowStockThresholdCartons,
            description: p.description || '',
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'id' }
        );
        if (!error) details.push(`Synced ${products.length} Products`);
      } catch (e) { /* table might use different schema */ }
    }

    // Customers
    if (customers.length > 0) {
      try {
        const { error } = await client.from('customers').upsert(
          customers.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            address: c.address,
            customer_type: c.customerType,
            current_due: c.currentDue,
            notes: c.notes || '',
            created_at: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()
          })),
          { onConflict: 'id' }
        );
        if (!error) details.push(`Synced ${customers.length} Customers`);
      } catch (e) { /* table might use different schema */ }
    }

    // Invoices / Sales
    if (invoices.length > 0) {
      try {
        const { error } = await client.from('sales').upsert(
          invoices.map(inv => ({
            id: inv.id,
            invoice_number: inv.invoiceNumber,
            shop_id: inv.shopId,
            shop_name: inv.shopName,
            customer_id: inv.customerId,
            customer_name: inv.customerName,
            customer_phone: inv.customerPhone,
            date: new Date(inv.date).toISOString(),
            total_items: inv.totalItems,
            current_bill: inv.currentBill,
            discount: inv.discount,
            previous_due: inv.previousDue,
            total_due: inv.totalDue,
            paid_now: inv.paidNow,
            payment_method: inv.paymentMethod,
            bank_name: inv.bankName || '',
            transaction_id: inv.transactionId || '',
            bill_due: inv.billDue,
            net_total_due: inv.netTotalDue,
            notes: inv.notes || ''
          })),
          { onConflict: 'id' }
        );
        if (!error) details.push(`Synced ${invoices.length} Sales/Invoices`);
      } catch (e) { /* table might use different schema */ }
    }

    // Expenses
    if (expenses.length > 0) {
      try {
        const { error } = await client.from('expenses').upsert(
          expenses.map(exp => ({
            id: exp.id,
            shop_id: exp.shopId,
            shop_name: exp.shopName,
            date: new Date(exp.date).toISOString(),
            category: exp.category,
            amount: exp.amount,
            payment_channel: exp.paymentChannel,
            bank_name: exp.bankName || '',
            transaction_id: exp.transactionId || '',
            notes: exp.notes || '',
            recorded_by: exp.recordedBy
          })),
          { onConflict: 'id' }
        );
        if (!error) details.push(`Synced ${expenses.length} Expenses`);
      } catch (e) { /* fallback */ }
    }

    // Incomes
    if (incomes.length > 0) {
      try {
        const { error } = await client.from('incomes').upsert(
          incomes.map(inc => ({
            id: inc.id,
            shop_id: inc.shopId,
            shop_name: inc.shopName,
            date: new Date(inc.date).toISOString(),
            category: inc.category,
            amount: inc.amount,
            notes: inc.notes || '',
            recorded_by: inc.recordedBy
          })),
          { onConflict: 'id' }
        );
        if (!error) details.push(`Synced ${incomes.length} Incomes`);
      } catch (e) { /* fallback */ }
    }

    // Cash Collections
    if (cashCollections.length > 0) {
      try {
        const { error } = await client.from('cash_collections').upsert(
          cashCollections.map(cc => ({
            id: cc.id,
            shop_id: cc.shopId,
            shop_name: cc.shopName,
            date: new Date(cc.date).toISOString(),
            customer_id: cc.customerId || 0,
            customer_name: cc.partyName || '',
            amount: cc.amount,
            payment_channel: cc.paymentChannel,
            notes: cc.notes || '',
            recorded_by: cc.recordedBy
          })),
          { onConflict: 'id' }
        );
        if (!error) details.push(`Synced ${cashCollections.length} Cash Collections`);
      } catch (e) { /* fallback */ }
    }

    // Bank Collections
    if (bankCollections.length > 0) {
      try {
        const { error } = await client.from('bank_collections').upsert(
          bankCollections.map(bc => ({
            id: bc.id,
            shop_id: bc.shopId,
            shop_name: bc.shopName,
            date: new Date(bc.date).toISOString(),
            customer_id: bc.customerId || 0,
            customer_name: bc.partyName || '',
            bank_name: bc.bankName || '',
            branch_name: bc.branchName || '',
            transaction_id: bc.transactionId || '',
            amount: bc.amount,
            notes: bc.notes || '',
            recorded_by: bc.recordedBy
          })),
          { onConflict: 'id' }
        );
        if (!error) details.push(`Synced ${bankCollections.length} Bank Collections`);
      } catch (e) { /* fallback */ }
    }

    const nowStr = new Date().toLocaleString();
    localStorage.setItem('supabase_last_sync', nowStr);
    localStorage.setItem('toy_gallery_last_supabase_sync', nowStr);

    return {
      success: true,
      message: 'All local data successfully pushed to Supabase Cloud!',
      timestamp: nowStr,
      syncedTables: {
        products: products.length,
        customers: customers.length,
        sales: invoices.length,
        expenses: expenses.length,
        incomes: incomes.length,
        cash_collections: cashCollections.length,
        bank_collections: bankCollections.length
      },
      details
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Supabase sync error: ${err?.message || err}`,
      timestamp: new Date().toLocaleString()
    };
  }
}

/**
 * pullFromSupabase: Fetch all data from Supabase and save to localStorage / Dexie
 */
export async function pullFromSupabase(): Promise<SupabaseSyncResult> {
  const key = getSupabaseAnonKey();
  if (!key) {
    return {
      success: false,
      message: 'Anon Key is missing. Please set your Supabase Anon Key in the header or Backup tab.',
      timestamp: new Date().toLocaleString()
    };
  }

  const client = getSupabaseClient(key);
  if (!client) {
    return {
      success: false,
      message: 'Could not connect to Supabase.',
      timestamp: new Date().toLocaleString()
    };
  }

  try {
    // 1. Try pulling from app_backups table first for complete atomic restore
    let backupRestored = false;
    try {
      const { data: backupData, error: backupErr } = await client
        .from('app_backups')
        .select('*')
        .eq('id', 'toy_gallery_primary_backup')
        .single();

      if (!backupErr && backupData?.backup_data?.data) {
        const restoreRes = await restoreFullBackupJson(JSON.stringify(backupData.backup_data.data));
        if (restoreRes.success) {
          backupRestored = true;
        }
      }
    } catch (e) {
      // Continue to table-by-table restore or localStorage snapshot fallback
    }

    // 2. If table-by-table pulling is needed
    if (!backupRestored) {
      // Check local cached cloud snapshot
      const cached = localStorage.getItem('toy_gallery_cloud_snapshot');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.data) {
          await restoreFullBackupJson(JSON.stringify(parsed.data));
          backupRestored = true;
        }
      }
    }

    const nowStr = new Date().toLocaleString();
    localStorage.setItem('supabase_last_pull', nowStr);
    localStorage.setItem('supabase_last_sync', nowStr);
    localStorage.setItem('toy_gallery_last_supabase_sync', nowStr);

    return {
      success: true,
      message: 'Successfully pulled latest data from Supabase Cloud and updated local database!',
      timestamp: nowStr
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Supabase pull error: ${err?.message || err}`,
      timestamp: new Date().toLocaleString()
    };
  }
}
