import React, { useState, useEffect } from 'react';
import { 
  Database, FolderHeart, ExternalLink, CheckCircle2, RotateCw, 
  X, AlertCircle, Save, Info, Sparkles, KeyRound, Globe, Send, ShieldCheck
} from 'lucide-react';
import { SPREADSHEET_ID, DRIVE_FOLDER_ID, testGasConnection } from '../services/googleSheetsService';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLiveConnected: boolean;
  lastSyncTime: string | null;
  totalMurid: number;
  totalGuru: number;
  gasWebAppUrl: string;
  onSaveGasWebAppUrl: (url: string) => void;
  onTriggerSyncAll: () => Promise<void>;
  isSyncing: boolean;
  onPushAllToSheets?: () => Promise<any>;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  isLiveConnected,
  lastSyncTime,
  totalMurid,
  totalGuru,
  gasWebAppUrl,
  onSaveGasWebAppUrl,
  onTriggerSyncAll,
  isSyncing,
  onPushAllToSheets
}) => {
  const [inputUrl, setInputUrl] = useState(gasWebAppUrl);
  const [savedNotice, setSavedNotice] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [pushNotice, setPushNotice] = useState<string | null>(null);
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setInputUrl(gasWebAppUrl);
  }, [gasWebAppUrl]);

  const handleTestGas = async () => {
    if (!inputUrl.trim()) {
      setTestResult({ success: false, message: 'Masukkan URL Web App terlebih dahulu' });
      return;
    }
    setIsTestingGas(true);
    setTestResult(null);
    try {
      const res = await testGasConnection(inputUrl.trim());
      setIsTestingGas(false);
      setTestResult(res);
      if (res.success) {
        onSaveGasWebAppUrl(inputUrl.trim());
      }
    } catch (err: any) {
      setIsTestingGas(false);
      setTestResult({ success: false, message: 'Uji koneksi gagal: ' + (err?.message || err) });
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGasWebAppUrl(inputUrl.trim());
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 4000);
  };

  const handleSync = async () => {
    setSyncNotice(null);
    try {
      await onTriggerSyncAll();
      setSyncNotice('Berhasil memperbarui data langsung dari Google Spreadsheet & Cloud Server!');
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      setSyncNotice('Gagal menyinkronkan: ' + (err?.message || err));
    }
  };

  const handlePushToSheets = async () => {
    if (!onPushAllToSheets) return;
    setIsPushing(true);
    setPushNotice(null);
    try {
      const res = await onPushAllToSheets();
      setIsPushing(false);
      setPushNotice(res?.message || 'Data Admin, Master Pelanggaran, dan Pengaturan berhasil dikirim ke Google Spreadsheet!');
      setTimeout(() => setPushNotice(null), 6000);
    } catch (err: any) {
      setIsPushing(false);
      setPushNotice('Gagal mengirim ke Google Spreadsheet: ' + (err?.message || err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Status Koneksi Google Sheets & Drive
              </h3>
              <p className="text-xs text-slate-500">
                Database Cloud Terpusat SMPN 2 Beji (Tersinkron di Semua Komputer & HP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Card */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold text-xs text-emerald-900">
                Status: TERHUBUNG KE GOOGLE SHEETS & CLOUD SERVER
              </span>
            </div>
            {lastSyncTime && (
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                Sinkron: {lastSyncTime}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Data Murid Live</span>
              <span className="text-xl font-black text-slate-900">{totalMurid}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">Siswa Terbaca dari Sheet</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Data Guru Live</span>
              <span className="text-xl font-black text-slate-900">{totalGuru}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">Dewan Guru Terbaca</span>
            </div>
          </div>

          <p className="text-[11px] text-emerald-800 leading-relaxed">
            Data tersimpan terpusat di Cloud Server dan membaca langsung Spreadsheet ID <code className="font-mono font-bold bg-emerald-100 px-1 rounded">{SPREADSHEET_ID.slice(0, 12)}...</code>. Saat dibuka dari komputer manapun, data selalu mutakhir.
          </p>
        </div>

        {/* Action Button: Re-Sync */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menghubungkan...' : 'Tarik Ulang Data dari Spreadsheet Sekarang'}</span>
          </button>

          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Buka Google Spreadsheet di tab baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Buka Sheets</span>
          </a>

          <a
            href={`https://drive.google.com/drive/folders/${DRIVE_FOLDER_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Buka Google Drive Folder Foto"
          >
            <FolderHeart className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Drive Foto</span>
          </a>
        </div>

        {syncNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Setting: Google Apps Script Web App URL */}
        <form onSubmit={handleSave} className="border-t border-slate-100 pt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                URL Web App Google Apps Script (Tulis ke Sheets & Upload Foto Drive)
              </label>
              {gasWebAppUrl ? (
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Tersimpan di Cloud
                </span>
              ) : (
                <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200">
                  Belum Diatur
                </span>
              )}
            </div>
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              URL ini tersimpan di Cloud Server dan <strong>otomatis berlaku untuk seluruh komputer</strong> yang membuka aplikasi. Digunakan untuk menulis data ke tab <code className="text-slate-700 font-bold">Admin</code>, <code className="text-slate-700 font-bold">Ref_Pelanggaran</code>, <code className="text-slate-700 font-bold">Log_Pelanggaran</code>, dan <code className="text-slate-700 font-bold">Pengaturan</code>.
            </p>
          </div>

          {savedNotice && (
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>URL Web App berhasil disimpan ke Cloud Server untuk semua komputer!</span>
            </div>
          )}

          {testResult && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              testResult.success 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handlePushToSheets}
              disabled={isPushing}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Kirim seluruh data Admin, 90 Jenis Pelanggaran, dan Kop Surat ke Google Spreadsheet"
            >
              {isPushing ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
              ) : (
                <Send className="w-3.5 h-3.5 text-amber-700" />
              )}
              <span>{isPushing ? 'Mengirim ke Spreadsheet...' : 'Kirim Seluruh Data ke Sheets'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestGas}
                disabled={isTestingGas}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isTestingGas ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{isTestingGas ? 'Menguji...' : 'Uji Koneksi'}</span>
              </button>

              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan URL ke Cloud</span>
              </button>
            </div>
          </div>
        </form>

        {pushNotice && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>{pushNotice}</span>
          </div>
        )}

      </div>
    </div>
  );
};
