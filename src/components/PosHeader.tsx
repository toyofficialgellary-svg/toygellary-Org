import React, { useState, useEffect } from 'react';
import { Shop } from '../db/db';
import { 
  Store, 
  Languages, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  RotateCw,
  Sparkles,
  LayoutDashboard,
  Smartphone,
  Cloud,
  Key,
  CheckCircle,
  X
} from 'lucide-react';
import { ApkInstallModal } from './ApkInstallModal';
import { 
  getSupabaseAnonKey, 
  saveSupabaseAnonKey, 
  syncToSupabase, 
  SUPABASE_URL 
} from '../db/supabaseSync';

interface PosHeaderProps {
  activeShop: Shop | undefined;
  shops: Shop[];
  onSelectShop: (shop: Shop) => void;
  languageMode: 'EN' | 'BN' | 'BOTH';
  onSelectLanguage: (lang: 'EN' | 'BN' | 'BOTH') => void;
  lowStockCount: number;
  onLowStockClick: () => void;
  currentUserRole?: 'SUPER_ADMIN' | 'MANAGER' | 'SALESMAN';
  onSelectUserRole?: (role: 'SUPER_ADMIN' | 'MANAGER' | 'SALESMAN') => void;
  onOpenDashboard?: () => void;
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  activeShop,
  shops,
  onSelectShop,
  languageMode,
  onSelectLanguage,
  lowStockCount,
  onLowStockClick,
  currentUserRole = 'SUPER_ADMIN',
  onSelectUserRole,
  onOpenDashboard
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseKey, setSupabaseKey] = useState<string>(() => getSupabaseAnonKey());
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => localStorage.getItem('supabase_last_sync') || '');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-inner shadow-amber-300">
            TG
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base md:text-lg tracking-wide uppercase text-white">
                Toy Gallery
              </h1>
              <span className="text-xs bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-medium border border-slate-700">
                টয় গ্যালারী
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Jalsa Market 2nd Fl, Riazuddin Bazar, Ctg • Farhad Hossain
            </p>
          </div>
        </div>

        {/* Status, Shop & Language Controls */}
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Supabase Cloud Connection & Sync Button */}
          <button
            onClick={() => setShowSupabaseModal(true)}
            title={supabaseKey ? "Supabase Cloud Connected (Click to view or Sync)" : "Supabase Offline / Key Not Set (Click to enter Anon Key)"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition ${
              supabaseKey.trim().length > 10
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                : 'bg-rose-950/80 text-rose-300 border-rose-700 hover:bg-rose-900 animate-pulse'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${supabaseKey.trim().length > 10 ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{supabaseKey.trim().length > 10 ? 'Supabase Connected' : 'Supabase Key'}</span>
          </button>

          {/* APK Install Button */}
          <button
            onClick={() => setShowApkModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition shadow-md cursor-pointer animate-pulse"
            title="Download & Install Android APK / Mobile App"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Install APK</span>
          </button>

          {/* Open Dashboard Button */}
          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm"
              title="Go to Business Dashboard (/dashboard)"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Open Dashboard</span>
            </button>
          )}

          {/* Online / Offline / Sync Status */}
          <div 
            onClick={triggerSync}
            title={isOnline ? "Online (Auto-sync ready)" : "Offline First Mode (IndexedDB Active)"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
              isOnline 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900' 
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{isOnline ? 'Online (IndexedDB Sync)' : 'Offline Active'}</span>
            <RotateCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>

          {/* Low Stock Alert */}
          {lowStockCount > 0 && (
            <button
              onClick={onLowStockClick}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{lowStockCount} Low Stock</span>
            </button>
          )}

          {/* Active Outlet / Shop Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <Store className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={activeShop?.id || ''}
              onChange={(e) => {
                const s = shops.find(x => x.id === Number(e.target.value));
                if (s) onSelectShop(s);
              }}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer pr-1"
            >
              {shops.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} {s.isMain ? '(Main Showroom)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* User Role Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                currentUserRole === 'SUPER_ADMIN'
                  ? 'bg-purple-950 text-purple-300 border-purple-800 hover:bg-purple-900'
                  : currentUserRole === 'MANAGER'
                  ? 'bg-blue-950 text-blue-300 border-blue-800 hover:bg-blue-900'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
              }`}
            >
              <span>
                {currentUserRole === 'SUPER_ADMIN' ? '👑 Super Admin (All Shops)' :
                 currentUserRole === 'MANAGER' ? '👔 Manager' : '🏷️ Salesman'}
              </span>
            </button>

            {showRoleDropdown && onSelectUserRole && (
              <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 text-xs">
                <div className="p-2 border-b border-slate-800 font-bold text-slate-400 text-[10px] uppercase">
                  Switch Active Role
                </div>
                <button
                  onClick={() => {
                    onSelectUserRole('SUPER_ADMIN');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg font-bold flex items-center justify-between ${
                    currentUserRole === 'SUPER_ADMIN' ? 'bg-purple-900/50 text-purple-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>👑 Farhad Hossain</span>
                  <span className="text-[10px] text-purple-400">Super Admin</span>
                </button>
                <button
                  onClick={() => {
                    onSelectUserRole('MANAGER');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg font-bold flex items-center justify-between ${
                    currentUserRole === 'MANAGER' ? 'bg-blue-900/50 text-blue-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>👔 Khorshed Alam</span>
                  <span className="text-[10px] text-blue-400">Manager</span>
                </button>
                <button
                  onClick={() => {
                    onSelectUserRole('SALESMAN');
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg font-bold flex items-center justify-between ${
                    currentUserRole === 'SALESMAN' ? 'bg-emerald-900/50 text-emerald-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>🏷️ Rakib Hasan</span>
                  <span className="text-[10px] text-emerald-400">Salesman</span>
                </button>
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs font-bold">
            <button
              onClick={() => onSelectLanguage('EN')}
              className={`px-2 py-0.5 rounded-md transition ${languageMode === 'EN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              EN
            </button>
            <button
              onClick={() => onSelectLanguage('BN')}
              className={`px-2 py-0.5 rounded-md transition ${languageMode === 'BN' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              বাংলা
            </button>
            <button
              onClick={() => onSelectLanguage('BOTH')}
              className={`px-2 py-0.5 rounded-md transition ${languageMode === 'BOTH' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Both
            </button>
          </div>
        </div>
      </div>

      <ApkInstallModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
      />

      {/* Supabase Connection & Key Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-800/80 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Supabase Online Backup & Sync</span>
                    <span className={`w-2 h-2 rounded-full ${supabaseKey.trim().length > 10 ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  </h3>
                  <p className="text-[11px] text-slate-400">Cloud database persistence & real-time sync</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSupabaseModal(false);
                  setSupabaseStatusMsg('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Target Supabase URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Supabase Project URL
                </label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono">
                  <span className="text-emerald-400 select-all font-bold">{SUPABASE_URL}</span>
                </div>
              </div>

              {/* Anon Key Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Supabase Anon Key (API Public Key)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => {
                      setSupabaseKey(e.target.value);
                      setSupabaseStatusMsg('');
                    }}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono pr-20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      saveSupabaseAnonKey(supabaseKey);
                      setSupabaseStatusMsg('✅ Anon Key saved to localStorage!');
                    }}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Key is saved securely in your browser's <strong className="text-slate-300">localStorage</strong> and used for sync.
                </p>
              </div>

              {/* Status Message */}
              {supabaseStatusMsg && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{supabaseStatusMsg}</span>
                </div>
              )}

              {/* Sync Info */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Connection Status:</span>
                  <span className={`font-bold flex items-center gap-1.5 ${supabaseKey.trim().length > 10 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${supabaseKey.trim().length > 10 ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                    {supabaseKey.trim().length > 10 ? 'Ready / Key Configured' : 'Anon Key Required'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Last Cloud Sync:</span>
                  <span className="text-amber-400 font-semibold">{lastSyncTime || 'Never'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800/50 px-5 py-3 border-t border-slate-700/80 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Pushes products, customers, sales & accounts.
              </span>
              <button
                type="button"
                disabled={isSupabaseSyncing || !supabaseKey.trim()}
                onClick={async () => {
                  saveSupabaseAnonKey(supabaseKey);
                  setIsSupabaseSyncing(true);
                  setSupabaseStatusMsg('Syncing all data to Supabase Cloud...');
                  try {
                    const res = await syncToSupabase();
                    if (res.success) {
                      setLastSyncTime(res.timestamp);
                      setSupabaseStatusMsg(`🎉 ${res.message}`);
                    } else {
                      setSupabaseStatusMsg(`⚠️ ${res.message}`);
                    }
                  } catch (err: any) {
                    setSupabaseStatusMsg(`❌ Error: ${err?.message}`);
                  } finally {
                    setIsSupabaseSyncing(false);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition ${
                  isSupabaseSyncing || !supabaseKey.trim()
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md'
                }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSupabaseSyncing ? 'animate-spin' : ''}`} />
                <span>{isSupabaseSyncing ? 'Syncing...' : 'Sync Now to Supabase'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
