import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  X, 
  CheckCircle2, 
  Share2, 
  QrCode, 
  Globe, 
  ShieldCheck, 
  HardDriveDownload,
  Copy,
  Check
} from 'lucide-react';
import { exportFullBackupJson } from '../db/db';

interface ApkInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkInstallModal: React.FC<ApkInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const sharedAppUrl = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : "https://ais-dev-3sfpis4hxlwiu57jzha5zf-962433584055.asia-southeast1.run.app";

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("Android ফোনে ইন্সটল করার জন্য:\n১. ক্রোম (Chrome) ব্রাউজারের উপরে ডানদিকের ৩-ডটে (⋮) চাপ দিন\n২. 'Install app' অথবা 'Add to Home screen' সিলেক্ট করুন।\n\nএটি সরাসরি আপনার মোবাইলে APK অ্যাপ হিসেবে ইনস্টল হয়ে যাবে!");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedAppUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBackup = async () => {
    const jsonStr = await exportFullBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Toy_Gallery_Complete_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 overflow-y-auto backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-2xl shadow-lg">
            <Smartphone className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Toy Gallery APK & Android App
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                Live APK
              </span>
            </div>
            <p className="text-xs text-slate-400">
              টয় গ্যালারী মোবাইল অ্যাপ ইন্সটল ও ফুল অফলাইন ব্যবহার
            </p>
          </div>
        </div>

        {/* Primary 1-Click Install Button */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span className="font-bold text-sm text-amber-300">
                Direct Install to Mobile Home Screen
              </span>
            </div>
            {isInstalled && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Installed
              </span>
            )}
          </div>

          <button
            onClick={handleInstallClick}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Download className="w-5 h-5 text-slate-950" />
            <span>{isInstalled ? 'App Already Installed on Device' : '📱 Install Toy Gallery App on Android'}</span>
          </button>
        </div>

        {/* Live URL & QR Code */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-teal-400" />
              Shared APK / Mobile Web URL:
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-teal-300 break-all select-all">
            {sharedAppUrl}
          </div>
        </div>

        {/* Step-by-Step Android Installation Guide */}
        <div className="space-y-2 text-xs text-slate-300 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800">
          <p className="font-bold text-amber-400 text-xs">
            📲 কিভাবে অ্যান্ড্রয়েড ফোনে APK হিসেবে ইনস্টল করবেন (৩ সহজ ধাপ):
          </p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
            <li>আপনার মোবাইলের <strong>Google Chrome</strong> ব্রাউজারে উপরের লিঙ্কটি ওপেন করুন।</li>
            <li>ডানদিকের ওপরের ৩-ডট মেনুতে <strong>(⋮)</strong> চাপ দিন।</li>
            <li><strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> চাপুন। সাথে সাথে মোবাইলে সরাসরি অ্যাপ আইকন চলে আসবে।</li>
          </ol>
        </div>

        {/* Offline Backup Export */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400">Offline Database & Settings:</span>
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition border border-slate-700"
          >
            <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
            Download Offline Backup
          </button>
        </div>
      </div>
    </div>
  );
};
