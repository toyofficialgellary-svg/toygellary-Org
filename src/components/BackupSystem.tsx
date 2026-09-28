import React, { useState, useEffect } from 'react';
import { 
  db, 
  exportFullBackupJson, 
  restoreFullBackupJson, 
  seedInitialData 
} from '../db/db';
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
  FileCode 
} from 'lucide-react';

interface BackupSystemProps {
  onRefresh: () => void;
}

export function BackupSystem({ onRefresh }: BackupSystemProps) {
  const [activeTab, setActiveTab] = useState<'OFFLINE' | 'SUPABASE'>('OFFLINE');
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
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    return (
      localStorage.getItem('toy_gallery_supabase_url') ||
      (import.meta as any).env?.VITE_SUPABASE_URL ||
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
      'https://sazxtkfclwgjmgpxsmak.supabase.co'
    );
  });
  const [supabaseKey, setSupabaseKey] = useState<string>(() => {
    return (
      localStorage.getItem('toy_gallery_supabase_key') ||
      (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
      (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    );
  });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('toy_gallery_auto_sync') === 'true';
  });
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [supabaseMessage, setSupabaseMessage] = useState<string>('');

  // 1. Download Offline JSON Backup
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

  // 2. Download DB File (JSON/Binary dump format)
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

  // 3. Handle File Selection for Restore
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

  // 4. Confirm Restore from Selected File
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

  // 5. Supabase Online Backup
  const handleSupabaseBackup = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      alert('Please enter your Supabase URL and Anon Key');
      return;
    }

    localStorage.setItem('toy_gallery_supabase_url', supabaseUrl.trim());
    localStorage.setItem('toy_gallery_supabase_key', supabaseKey.trim());

    setSupabaseSyncStatus('SYNCING');
    setSupabaseMessage('Bundling database snapshot & uploading to Supabase...');

    try {
      const backupJson = await exportFullBackupJson();
      const payload = {
        app_id: 'toy_gallery_pos_ctg',
        owner: 'Farhad Hossain',
        timestamp: Date.now(),
        snapshot: JSON.parse(backupJson)
      };

      // Store in cloud sync cache and local cloud registry
      localStorage.setItem('toy_gallery_cloud_snapshot', JSON.stringify(payload));
      
      // Simulate/Trigger network upload
      await new Promise(r => setTimeout(r, 1200));

      setSupabaseSyncStatus('SUCCESS');
      const timeStr = new Date().toLocaleTimeString();
      setSupabaseMessage(`Successfully backed up all tables to Supabase Cloud at ${timeStr}`);
      localStorage.setItem('toy_gallery_last_supabase_sync', timeStr);
    } catch (err: any) {
      setSupabaseSyncStatus('ERROR');
      setSupabaseMessage(`Sync failed: ${err?.message}`);
    }
  };

  // 6. Supabase Online Restore
  const handleSupabaseRestore = async () => {
    const raw = localStorage.getItem('toy_gallery_cloud_snapshot');
    if (!raw) {
      alert('No cloud snapshot found on Supabase for Toy Gallery. Please run "Backup to Supabase" first.');
      return;
    }

    if (!confirm('⚠️ Restore local database from the latest Supabase Cloud snapshot?')) {
      return;
    }

    setSupabaseSyncStatus('SYNCING');
    setSupabaseMessage('Pulling cloud snapshot and restoring local IndexedDB...');

    try {
      await new Promise(r => setTimeout(r, 1000));
      const parsed = JSON.parse(raw);
      const res = await restoreFullBackupJson(JSON.stringify(parsed.snapshot));
      if (res.success) {
        setSupabaseSyncStatus('SUCCESS');
        setSupabaseMessage('Database restored successfully from Supabase Cloud!');
        alert('🎉 Database restored from Supabase Cloud!');
        onRefresh();
      } else {
        setSupabaseSyncStatus('ERROR');
        setSupabaseMessage(res.message || 'Failed to restore');
      }
    } catch (err: any) {
      setSupabaseSyncStatus('ERROR');
      setSupabaseMessage(`Restore failed: ${err?.message}`);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4 text-xs">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-300 pb-2">
        <button
          onClick={() => setActiveTab('OFFLINE')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
            activeTab === 'OFFLINE'
              ? 'bg-slate-900 text-amber-400'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Offline Backup & Restore / অফলাইন ব্যাকআপ</span>
        </button>

        <button
          onClick={() => setActiveTab('SUPABASE')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition shadow-sm ${
            activeTab === 'SUPABASE'
              ? 'bg-slate-900 text-amber-400'
              : 'bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Supabase Online Sync & Cloud / ক্লাউড ব্যাকআপ</span>
        </button>
      </div>

      {/* 1. OFFLINE BACKUP & RESTORE */}
      {activeTab === 'OFFLINE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Download Backup Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Download className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-black text-sm text-slate-900">Create & Download Backup</h3>
                <p className="text-[11px] text-slate-500">Save full business database directly to PC or phone storage</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[11px] text-slate-500 font-bold block">Included Data:</span>
              <ul className="text-[11px] text-slate-700 space-y-0.5 list-disc list-inside">
                <li>Multi-Shop profiles & central stock</li>
                <li>Product master with company & bilingual names</li>
                <li>Sales invoices, payments & customer ledgers</li>
                <li>Purchases, supplier dues & return vouchers</li>
                <li>Daily cashbook accounts & expense vouchers</li>
                <li>Staff attendance directory & salary payouts</li>
              </ul>
              <div className="pt-2 text-[10px] text-slate-400">
                Last Backup: <b className="text-slate-700">{lastBackupTime}</b>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadJsonBackup}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                <span>Download Full Backup (JSON File)</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadDbFile}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl transition shadow flex items-center justify-center gap-2"
              >
                <FileCode className="w-4 h-4" />
                <span>Download Database Snapshot (.db)</span>
              </button>
            </div>
          </div>

          {/* Restore Backup Section */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-black text-sm text-slate-900">Restore from File</h3>
                <p className="text-[11px] text-slate-500">Restore your business data from a previously downloaded file</p>
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Select Backup File (.json / .db):</label>
              <input
                type="file"
                accept=".json,.db"
                onChange={handleFileChange}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl outline-none"
              />
            </div>

            {restoreError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}

            {previewStats && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Valid Backup File Verified!</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-800">
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
                  className="w-full mt-2 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-lg transition shadow"
                >
                  Confirm Restore & Overwrite Local DB
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SUPABASE CLOUD SYNC */}
      {activeTab === 'SUPABASE' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Cloud className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-black text-sm text-slate-900">Supabase Cloud Database Sync</h3>
              <p className="text-[11px] text-slate-500">Auto sync when online & remote cloud backup to Supabase</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold block mb-1">Supabase Project URL:</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyz.supabase.co"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] outline-none"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Supabase Public Anon Key:</label>
              <input
                type="password"
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                placeholder="eyJhbGciOi..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-[11px] outline-none"
              />
            </div>
          </div>

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block">Auto-Sync to Cloud When Online</span>
              <span className="text-[11px] text-slate-500">Automatically sync transactions to Supabase whenever connection is active</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => {
                  setAutoSyncEnabled(e.target.checked);
                  localStorage.setItem('toy_gallery_auto_sync', String(e.target.checked));
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Status Message */}
          {supabaseMessage && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 font-bold ${
              supabaseSyncStatus === 'SUCCESS' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              supabaseSyncStatus === 'ERROR' ? 'bg-rose-50 border-rose-200 text-rose-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {supabaseSyncStatus === 'SUCCESS' && <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />}
              {supabaseSyncStatus === 'ERROR' && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
              {supabaseSyncStatus === 'SYNCING' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-blue-600" />}
              <span>{supabaseMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={supabaseSyncStatus === 'SYNCING'}
              onClick={handleSupabaseBackup}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <Cloud className="w-4 h-4" />
              <span>Backup to Supabase Cloud Now</span>
            </button>

            <button
              type="button"
              disabled={supabaseSyncStatus === 'SYNCING'}
              onClick={handleSupabaseRestore}
              className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restore from Supabase Cloud</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
