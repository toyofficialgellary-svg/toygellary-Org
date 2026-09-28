import React, { useState, useEffect } from 'react';
import { 
  db, 
  exportFullBackupJson, 
  restoreFullBackupJson 
} from '../db/db';
import { 
  getSupabaseAnonKey, 
  saveSupabaseAnonKey, 
  syncToSupabase, 
  pullFromSupabase, 
  testSupabaseConnection,
  SUPABASE_URL,
  SupabaseSyncResult 
} from '../db/supabaseSync';
import { 
  Database, 
  Cloud, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  HardDrive, 
  Server, 
  ShieldCheck, 
  Key, 
  FileJson, 
  FileCode,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

interface BackupSystemProps {
  onRefresh: () => void;
}

export function BackupSystem({ onRefresh }: BackupSystemProps) {
  const [activeTab, setActiveTab] = useState<'SUPABASE' | 'OFFLINE'>('SUPABASE');
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string>(() => {
    return localStorage.getItem('toy_gallery_last_backup') || 'Never';
  });

  // Restore file preview
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [previewStats, setPreviewStats] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Supabase state
  const [supabaseUrl] = useState<string>(SUPABASE_URL);
  const [supabaseKey, setSupabaseKey] = useState<string>(() => getSupabaseAnonKey());
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);
  
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('supabase_last_sync') || localStorage.getItem('toy_gallery_last_supabase_sync') || 'Never';
  });
  
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [syncDetails, setSyncDetails] = useState<SupabaseSyncResult | null>(null);
  const [testConnStatus, setTestConnStatus] = useState<{ testing: boolean; ok?: boolean; msg?: string }>({ testing: false });

  const isConnected = Boolean(supabaseKey.trim().length > 10);

  // 1. Save Anon Key
  const handleSaveKey = () => {
    saveSupabaseAnonKey(supabaseKey);
    setIsKeySaved(true);
    setStatusMessage('✅ Supabase Anon Key saved to localStorage!');
    setTimeout(() => setIsKeySaved(false), 3000);
  };

  // 2. Test Connection
  const handleTestConnection = async () => {
    if (!supabaseKey.trim()) {
      setStatusMessage('⚠️ Please enter your Supabase Anon Key first.');
      return;
    }
    setTestConnStatus({ testing: true });
    try {
      const res = await testSupabaseConnection(supabaseKey.trim());
      setTestConnStatus({ testing: false, ok: res.ok, msg: res.message });
    } catch (err: any) {
      setTestConnStatus({ testing: false, ok: false, msg: err?.message || 'Connection failed' });
    }
  };

  // 3. Sync Now (Push all localStorage & Dexie tables to Supabase)
  const handleSyncNow = async () => {
    if (!supabaseKey.trim()) {
      setStatusMessage('⚠️ Please enter and save your Supabase Anon Key before syncing.');
      return;
    }

    saveSupabaseAnonKey(supabaseKey);
    setSyncStatus('SYNCING');
    setStatusMessage('Pushing products, customers, sales, expenses, incomes, cash & bank collections to Supabase Cloud...');
    setSyncDetails(null);

    try {
      const result = await syncToSupabase();
      if (result.success) {
        setSyncStatus('SUCCESS');
        setStatusMessage(result.message);
        setLastSyncTime(result.timestamp);
        setSyncDetails(result);
      } else {
        setSyncStatus('ERROR');
        setStatusMessage(result.message);
      }
    } catch (err: any) {
      setSyncStatus('ERROR');
      setStatusMessage(`Sync failed: ${err?.message || err}`);
    }
  };

  // 4. Pull from Cloud (Fetch all data from Supabase and save to local storage & Dexie)
  const handlePullFromSupabase = async () => {
    if (!supabaseKey.trim()) {
      setStatusMessage('⚠️ Please enter and save your Supabase Anon Key before pulling.');
      return;
    }

    if (!confirm('⚠️ Are you sure you want to pull data from Supabase Cloud? This will synchronize and update your local database.')) {
      return;
    }

    saveSupabaseAnonKey(supabaseKey);
    setSyncStatus('SYNCING');
    setStatusMessage('Pulling cloud data from Supabase and updating local database...');

    try {
      const result = await pullFromSupabase();
      if (result.success) {
        setSyncStatus('SUCCESS');
        setStatusMessage(result.message);
        setLastSyncTime(result.timestamp);
        onRefresh();
      } else {
        setSyncStatus('ERROR');
        setStatusMessage(result.message);
      }
    } catch (err: any) {
      setSyncStatus('ERROR');
      setStatusMessage(`Pull failed: ${err?.message || err}`);
    }
  };

  // 5. Offline File Export (JSON)
  const handleDownloadJsonBackup = async () => {
    setIsExporting(true);
    try {
      const json = await exportFullBackupJson();
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Toy_Gallery_Backup_${timestamp}.json`;

      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString();
      setLastBackupTime(nowStr);
      localStorage.setItem('toy_gallery_last_backup', nowStr);
      alert('✅ Offline backup downloaded successfully! Contains all shops, products, invoices, customers, and staff.');
    } catch (err: any) {
      alert(`Error exporting backup: ${err?.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 6. Download DB File
  const handleDownloadDbFile = async () => {
    setIsExporting(true);
    try {
      const json = await exportFullBackupJson();
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Toy_Gallery_IndexedDB_${timestamp}.db`;

      const blob = new Blob([json], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('✅ Database file (.db) downloaded successfully!');
    } catch (err: any) {
      alert(`Error: ${err?.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // 7. Handle File Change for Offline Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.products || !parsed.shops) {
          throw new Error('Missing core tables (products, shops) in backup file.');
        }

        setSelectedFileContent(text);
        setPreviewStats({
          version: parsed.version || '1.0',
          exportDate: parsed.exportDate ? new Date(parsed.exportDate).toLocaleString() : 'Unknown',
          shops: parsed.shops?.length || 0,
          products: parsed.products?.length || 0,
          invoices: parsed.invoices?.length || 0,
          customers: parsed.customers?.length || 0,
          purchases: parsed.purchases?.length || 0,
          staff: parsed.staff?.length || 0
        });
      } catch (err: any) {
        setRestoreError(err?.message || 'Invalid backup JSON file');
        setSelectedFileContent(null);
        setPreviewStats(null);
      }
    };
    reader.readAsText(file);
  };

  // 8. Confirm Restore from Selected File
  const handleConfirmRestore = async () => {
    if (!selectedFileContent) return;
    if (!confirm('⚠️ WARNING: Restoring will overwrite all local data in this app with the backup file. Proceed?')) {
      return;
    }

    setIsRestoring(true);
    try {
      const res = await restoreFullBackupJson(selectedFileContent);
      if (res.success) {
        alert('🎉 System successfully restored from backup file!');
        setSelectedFileContent(null);
        setPreviewStats(null);
        onRefresh();
      } else {
        alert(`Restore failed: ${res.message}`);
      }
    } catch (err: any) {
      alert(`Restore error: ${err?.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4 text-xs">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">Database Backup & Cloud Sync Hub</h2>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 border border-slate-700">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span className={isConnected ? 'text-emerald-300' : 'text-rose-300'}>
                  {isConnected ? 'Supabase Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Persistent online cloud backup via Supabase & zero-loss offline IndexedDB snapshots
            </p>
          </div>
        </div>

        {/* Sync Summary Pill */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
          <Clock className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-slate-400 text-[10px] block font-semibold">LAST SYNC TIME</span>
            <span className="text-white font-bold">{lastSyncTime || 'Never synced'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('SUPABASE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shadow-sm ${
            activeTab === 'SUPABASE'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Supabase Online Sync (ক্লাউড ব্যাকআপ)</span>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-300' : 'bg-rose-400'}`} />
        </button>

        <button
          onClick={() => setActiveTab('OFFLINE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shadow-sm ${
            activeTab === 'OFFLINE'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Offline File Backup / Restore (অফলাইন ফাইল)</span>
        </button>
      </div>

      {/* 1. SUPABASE ONLINE SYNC TAB */}
      {activeTab === 'SUPABASE' && (
        <div className="bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-800 space-y-5">
          {/* Status & Project URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-bold block mb-1 uppercase tracking-wider text-[11px]">
                Supabase Project URL:
              </label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-bold select-all truncate">{supabaseUrl}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-bold block uppercase tracking-wider text-[11px]">
                  Supabase Anon Key (API Key):
                </label>
                {isKeySaved && (
                  <span className="text-emerald-400 font-bold text-[10px] animate-fade-in flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Saved to localStorage!
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow flex items-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>

          {/* Connection Status & Test Bar */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-rose-500'}`} />
              <div>
                <span className="font-bold text-white text-xs block">
                  Cloud Status: {isConnected ? 'Ready for Real-time Cloud Sync' : 'Anon Key Not Set'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Last Synchronized: <strong className="text-amber-400">{lastSyncTime || 'Never'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={testConnStatus.testing || !supabaseKey.trim()}
                onClick={handleTestConnection}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
              >
                {testConnStatus.testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {testConnStatus.msg && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              testConnStatus.ok 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}>
              {testConnStatus.ok ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{testConnStatus.msg}</span>
            </div>
          )}

          {/* PRIMARY CLOUD ACTION BUTTONS: Sync Now & Pull */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Sync Now (Push) */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <ArrowUpRight className="w-5 h-5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Sync Now (Push to Cloud)</h4>
                  <p className="text-[11px] text-slate-400">Pushes all products, customers, sales, expenses, and collections to Supabase</p>
                </div>
              </div>

              <button
                type="button"
                disabled={syncStatus === 'SYNCING' || !supabaseKey.trim()}
                onClick={handleSyncNow}
                className={`w-full py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg ${
                  syncStatus === 'SYNCING' || !supabaseKey.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${syncStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
                <span>{syncStatus === 'SYNCING' ? 'Pushing Data to Supabase...' : '☁️ Sync Now to Supabase'}</span>
              </button>
            </div>

            {/* Pull from Cloud */}
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-teal-400">
                <ArrowDownLeft className="w-5 h-5" />
                <div>
                  <h4 className="font-bold text-white text-sm">Pull from Cloud (Fetch Data)</h4>
                  <p className="text-[11px] text-slate-400">Downloads latest snapshot from Supabase and synchronizes local storage</p>
                </div>
              </div>

              <button
                type="button"
                disabled={syncStatus === 'SYNCING' || !supabaseKey.trim()}
                onClick={handlePullFromSupabase}
                className={`w-full py-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-lg ${
                  syncStatus === 'SYNCING' || !supabaseKey.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                }`}
              >
                <Download className={`w-4 h-4 ${syncStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
                <span>{syncStatus === 'SYNCING' ? 'Pulling from Cloud...' : '📥 Pull from Supabase Cloud'}</span>
              </button>
            </div>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-4 rounded-xl border flex items-center gap-2.5 font-bold ${
              syncStatus === 'SUCCESS' ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300' :
              syncStatus === 'ERROR' ? 'bg-rose-950/80 border-rose-700 text-rose-300' :
              'bg-blue-950/80 border-blue-700 text-blue-300'
            }`}>
              {syncStatus === 'SUCCESS' && <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />}
              {syncStatus === 'ERROR' && <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />}
              {syncStatus === 'SYNCING' && <RefreshCw className="w-5 h-5 shrink-0 animate-spin text-blue-400" />}
              <span className="text-xs">{statusMessage}</span>
            </div>
          )}

          {/* Sync Stats Breakdown */}
          {syncDetails?.syncedTables && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                Synchronized Table Quantities:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Products</span>
                  <span className="text-white font-bold">{syncDetails.syncedTables.products}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Customers</span>
                  <span className="text-white font-bold">{syncDetails.syncedTables.customers}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Sales</span>
                  <span className="text-white font-bold">{syncDetails.syncedTables.sales}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Expenses</span>
                  <span className="text-white font-bold">{syncDetails.syncedTables.expenses}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Incomes</span>
                  <span className="text-white font-bold">{syncDetails.syncedTables.incomes}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Cash Coll.</span>
                  <span className="text-white font-bold">{syncDetails.syncedTables.cash_collections}</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Bank Coll.</span>
                  <span className="text-white font-bold">{syncDetails.syncedTables.bank_collections}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. OFFLINE BACKUP & RESTORE TAB */}
      {activeTab === 'OFFLINE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Download Backup Section */}
          <div className="bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Download className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Create & Download Offline File</h3>
                <p className="text-[11px] text-slate-400">Save full business database directly to PC or phone storage</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-bold block">Included Data:</span>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                <li>Multi-Shop profiles & central stock</li>
                <li>Product master with company & bilingual names</li>
                <li>Sales invoices, payments & customer ledgers</li>
                <li>Purchases, supplier dues & return vouchers</li>
                <li>Daily cashbook accounts & expense vouchers</li>
                <li>Staff attendance directory & salary payouts</li>
              </ul>
              <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-850">
                Last Offline Backup: <b className="text-slate-300">{lastBackupTime}</b>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadJsonBackup}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                <span>Download Full Backup (JSON File)</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadDbFile}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <FileCode className="w-4 h-4" />
                <span>Download Database Snapshot (.db)</span>
              </button>
            </div>
          </div>

          {/* Restore Backup Section */}
          <div className="bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Upload className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Restore from File</h3>
                <p className="text-[11px] text-slate-400">Restore your business data from a previously downloaded file</p>
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1 text-slate-300">Select Backup File (.json / .db):</label>
              <input
                type="file"
                accept=".json,.db"
                onChange={handleFileChange}
                className="w-full p-2 bg-slate-950 border border-slate-700 text-slate-300 rounded-xl outline-none"
              />
            </div>

            {restoreError && (
              <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl text-rose-300 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{restoreError}</span>
              </div>
            )}

            {previewStats && (
              <div className="bg-emerald-950/60 border border-emerald-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Valid Backup File Verified!</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-200">
                  <span>Exported: <b>{previewStats.exportDate}</b></span>
                  <span>Products: <b>{previewStats.products}</b></span>
                  <span>Shops: <b>{previewStats.shops}</b></span>
                  <span>Invoices: <b>{previewStats.invoices}</b></span>
                  <span>Customers: <b>{previewStats.customers}</b></span>
                  <span>Purchases: <b>{previewStats.purchases}</b></span>
                </div>

                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={handleConfirmRestore}
                  className="w-full mt-2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl transition shadow"
                >
                  Confirm Restore & Overwrite Local DB
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
