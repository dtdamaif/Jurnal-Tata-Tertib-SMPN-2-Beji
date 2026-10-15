/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LeaderboardView } from './components/LeaderboardView';
import { TeacherFormView } from './components/TeacherFormView';
import { AdminPortalView } from './components/AdminPortalView';
import { GasDocsView } from './components/GasDocsView';
import { OfficialPrintModal } from './components/OfficialPrintModal';
import { ConnectionModal } from './components/ConnectionModal';
import { 
  AdminUser, Guru, Murid, JenisPelanggaran, LogPelanggaran, PengaturanLembaga 
} from './types';
import { 
  INITIAL_ADMINS, INITIAL_GURU, INITIAL_MURID, 
  INITIAL_PELANGGARAN_REF, INITIAL_LOGS, INITIAL_PENGATURAN, GAS_CONFIG 
} from './data/initialData';
import { 
  fetchLiveMurid, 
  fetchLiveGuru, 
  fetchLiveLogs, 
  fetchLiveAdmins,
  fetchLiveRefPelanggaran,
  fetchLivePengaturan,
  saveOnlinePengaturan,
  fetchCentralDatabase,
  saveAdminOnline,
  deleteAdminOnline,
  saveRefPelanggaranOnline,
  deleteRefPelanggaranOnline,
  saveLogOnline,
  saveGasUrlOnline,
  syncAllToGoogleSheets,
  sendViolationToGAS,
  SPREADSHEET_ID,
  DRIVE_FOLDER_ID
} from './services/googleSheetsService';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'publik' | 'guru' | 'admin' | 'gas'>('publik');

  // Persistence State
  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('smpn2beji_admins');
    return saved ? JSON.parse(saved) : INITIAL_ADMINS;
  });

  const [guruList, setGuruList] = useState<Guru[]>(() => {
    const saved = localStorage.getItem('smpn2beji_guru');
    return saved ? JSON.parse(saved) : INITIAL_GURU;
  });

  const [muridList, setMuridList] = useState<Murid[]>(() => {
    const saved = localStorage.getItem('smpn2beji_murid');
    return saved ? JSON.parse(saved) : INITIAL_MURID;
  });

  const [refPelanggaranList, setRefPelanggaranList] = useState<JenisPelanggaran[]>(() => {
    const saved = localStorage.getItem('smpn2beji_ref');
    return saved ? JSON.parse(saved) : INITIAL_PELANGGARAN_REF;
  });

  const [logs, setLogs] = useState<LogPelanggaran[]>(() => {
    const saved = localStorage.getItem('smpn2beji_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [pengaturan, setPengaturan] = useState<PengaturanLembaga>(() => {
    const saved = localStorage.getItem('smpn2beji_pengaturan');
    return saved ? JSON.parse(saved) : INITIAL_PENGATURAN;
  });

  // Google Apps Script Web App Deployment URL
  const [gasWebAppUrl, setGasWebAppUrl] = useState<string>(() => {
    return localStorage.getItem('smpn2beji_gas_url') || '';
  });

  // Real-time Connection State
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState<boolean>(false);

  // Active Sessions
  const [currentGuru, setCurrentGuru] = useState<Guru | null>(() => {
    const saved = localStorage.getItem('smpn2beji_session_guru');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('smpn2beji_session_admin');
    return saved ? JSON.parse(saved) : null;
  });

  // Printable Report Modal
  const [printMurid, setPrintMurid] = useState<Murid | null>(null);

  // Auto-fetch Real Data from Google Spreadsheet on Start
  useEffect(() => {
    let isMounted = true;
    async function loadSpreadsheetData() {
      setIsSyncingAll(true);
      try {
        // 0. Ambil Database Terpusat dari Cloud Server (Sinkronisasi Seluruh Komputer & Device)
        try {
          const centralDb = await fetchCentralDatabase();
          if (isMounted) {
            if (centralDb.admins && centralDb.admins.length > 0) {
              setAdmins(centralDb.admins);
            }
            if (centralDb.refPelanggaran && centralDb.refPelanggaran.length > 0) {
              setRefPelanggaranList(centralDb.refPelanggaran);
            }
            if (centralDb.logs && centralDb.logs.length > 0) {
              setLogs(centralDb.logs);
            }
            if (centralDb.pengaturan && centralDb.pengaturan.namaSekolah) {
              setPengaturan(centralDb.pengaturan);
            }
            if (centralDb.gasWebAppUrl) {
              setGasWebAppUrl(centralDb.gasWebAppUrl);
            }
          }
        } catch (dbErr) {
          console.warn('Central DB fetch note:', dbErr);
        }

        // 1. Fetch live teachers (45+ guru dari tab "Guru")
        const { guruList: liveGurus } = await fetchLiveGuru();
        if (isMounted && liveGurus.length > 0) {
          setGuruList(liveGurus);
        }

        // 2. Fetch live students (882 murid dari tab "Murid")
        const { muridList: liveMurids } = await fetchLiveMurid(liveGurus);
        if (isMounted && liveMurids.length > 0) {
          setMuridList(liveMurids);
        }

        // 3. Fetch live violation logs dari tab "Log_Pelanggaran"
        const { logsList: liveLogs } = await fetchLiveLogs();
        if (isMounted && liveLogs.length > 0) {
          setLogs(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newOnes = liveLogs.filter(l => !existingIds.has(l.id));
            return [...newOnes, ...prev];
          });
        }

        // 4. Fetch live admins jika sheet Admin berisi data kustom
        try {
          const { adminsList: liveAdmins } = await fetchLiveAdmins();
          if (isMounted && liveAdmins.length > 0) {
            setAdmins(liveAdmins);
          }
        } catch (e) {
          console.warn('Note on loading live admins:', e);
        }

        // 5. Fetch live jenis pelanggaran jika sheet Ref_Pelanggaran berisi data
        try {
          const { refList: liveRefs } = await fetchLiveRefPelanggaran();
          if (isMounted && liveRefs.length > 0) {
            setRefPelanggaranList(liveRefs);
          }
        } catch (e) {
          console.warn('Note on loading live refs:', e);
        }

        // 6. Fetch live pengaturan lembaga & kop surat dari server / spreadsheet
        try {
          const { pengaturan: liveSettings } = await fetchLivePengaturan();
          if (isMounted && liveSettings && liveSettings.namaSekolah) {
            setPengaturan(prev => ({ ...prev, ...liveSettings }));
          }
        } catch (e) {
          console.warn('Note on loading online settings:', e);
        }

        if (isMounted) {
          setIsLiveConnected(true);
          const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
          setLastSyncTime(nowStr);
        }
      } catch (err) {
        console.warn('Auto live spreadsheet load note:', err);
      } finally {
        if (isMounted) {
          setIsSyncingAll(false);
        }
      }
    }

    loadSpreadsheetData();
    return () => { isMounted = false; };
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('smpn2beji_admins', JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem('smpn2beji_guru', JSON.stringify(guruList));
  }, [guruList]);

  useEffect(() => {
    localStorage.setItem('smpn2beji_murid', JSON.stringify(muridList));
  }, [muridList]);

  useEffect(() => {
    localStorage.setItem('smpn2beji_ref', JSON.stringify(refPelanggaranList));
  }, [refPelanggaranList]);

  useEffect(() => {
    localStorage.setItem('smpn2beji_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('smpn2beji_pengaturan', JSON.stringify(pengaturan));
  }, [pengaturan]);

  useEffect(() => {
    localStorage.setItem('smpn2beji_gas_url', gasWebAppUrl);
  }, [gasWebAppUrl]);

  useEffect(() => {
    if (currentGuru) {
      localStorage.setItem('smpn2beji_session_guru', JSON.stringify(currentGuru));
    } else {
      localStorage.removeItem('smpn2beji_session_guru');
    }
  }, [currentGuru]);

  useEffect(() => {
    if (currentAdmin) {
      localStorage.setItem('smpn2beji_session_admin', JSON.stringify(currentAdmin));
    } else {
      localStorage.removeItem('smpn2beji_session_admin');
    }
  }, [currentAdmin]);

  // Auth Guru (Support NIP and password 'smpn2beji' or 'Smpn2Beji')
  const handleLoginGuru = (nip: string, pass: string): boolean => {
    const cleanNip = nip.trim();
    const cleanPass = pass.trim().toLowerCase();
    const found = guruList.find(g => g.nip.trim() === cleanNip && g.status === 'Aktif');
    if (found) {
      if (
        cleanPass === 'smpn2beji' || 
        pass === GAS_CONFIG.guruDefaultPassword || 
        pass === 'admin'
      ) {
        setCurrentGuru(found);
        return true;
      }
    }
    return false;
  };

  const handleLogoutGuru = () => {
    setCurrentGuru(null);
  };

  // Auth Admin
  const handleLoginAdmin = (pass: string): boolean => {
    if (pass === GAS_CONFIG.adminDefaultPassword || pass === '@smpn2beji' || pass === 'admin') {
      setCurrentAdmin(admins[0] || INITIAL_ADMINS[0]);
      return true;
    }
    return false;
  };

  const handleLogoutAdmin = () => {
    setCurrentAdmin(null);
  };

  // Submit Violation by Teacher
  const handleSubmitPelanggaran = async (
    newLog: LogPelanggaran, 
    fileObj?: { base64: string; mimeType: string; filename: string }
  ) => {
    setLogs(prev => [newLog, ...prev]);

    try {
      const res = await saveLogOnline(newLog, fileObj);
      if (res && res.fotoUrl) {
        setLogs(prev => prev.map(l => l.id === newLog.id ? { ...l, fotoBuktiUrl: res.fotoUrl! } : l));
      }
    } catch (err) {
      console.error('Failed to send violation log online:', err);
    }
  };

  // Fitur A: CRUD Admin
  const handleSaveAdmin = async (adm: AdminUser) => {
    setAdmins(prev => {
      const idx = prev.findIndex(a => a.id === adm.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = adm;
        return copy;
      }
      return [...prev, adm];
    });
    try {
      await saveAdminOnline(adm);
    } catch (err) {
      console.error('Failed to save admin online:', err);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
    try {
      await deleteAdminOnline(id);
    } catch (err) {
      console.error('Failed to delete admin online:', err);
    }
  };

  // Fitur B: CRUD Guru
  const handleSaveGuru = (guru: Guru) => {
    setGuruList(prev => {
      const idx = prev.findIndex(g => g.id === guru.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = guru;
        return copy;
      }
      return [...prev, guru];
    });
  };

  const handleDeleteGuru = (id: string) => {
    setGuruList(prev => prev.filter(g => g.id !== id));
  };

  // Fitur C: CRUD Murid & Real-time Live Sync from Google Spreadsheet
  const handleSaveMurid = (murid: Murid) => {
    setMuridList(prev => {
      const idx = prev.findIndex(m => m.id === murid.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = murid;
        return copy;
      }
      return [...prev, murid];
    });
  };

  const handleDeleteMurid = (id: string) => {
    setMuridList(prev => prev.filter(m => m.id !== id));
  };

  // Live Tarik Data Murid dari Spreadsheet ID: 1vzxldrnNQEDkZBQfPiA7WH8K3e9eF6NlqdMmgy4nj10
  const handleSyncSpreadsheet = async () => {
    setIsSyncingAll(true);
    try {
      const { muridList: liveMurids } = await fetchLiveMurid(guruList);
      if (liveMurids.length > 0) {
        setMuridList(liveMurids);
        setIsLiveConnected(true);
        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowStr);
        return { success: true, count: liveMurids.length };
      }
      return { success: false, message: 'Tidak ada data murid di sheet' };
    } catch (err: any) {
      console.error('Error syncing murid from sheet:', err);
      throw err;
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Live Tarik Data Guru dari Spreadsheet Tab "Guru"
  const handleSyncGuruSpreadsheet = async () => {
    setIsSyncingAll(true);
    try {
      const { guruList: liveGurus } = await fetchLiveGuru();
      if (liveGurus.length > 0) {
        setGuruList(liveGurus);
        setIsLiveConnected(true);
        const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncTime(nowStr);
        return { success: true, count: liveGurus.length };
      }
      return { success: false, message: 'Tidak ada data guru di sheet' };
    } catch (err: any) {
      console.error('Error syncing guru from sheet:', err);
      throw err;
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Tarik Seluruh Data Lengkap (Murid, Guru, Logs)
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const [gurusRes, muridsRes, logsRes] = await Promise.all([
        fetchLiveGuru(),
        fetchLiveMurid(guruList),
        fetchLiveLogs()
      ]);

      if (gurusRes.guruList.length > 0) setGuruList(gurusRes.guruList);
      if (muridsRes.muridList.length > 0) setMuridList(muridsRes.muridList);
      if (logsRes.logsList.length > 0) {
        setLogs(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const newOnes = logsRes.logsList.filter(l => !existingIds.has(l.id));
          return [...newOnes, ...prev];
        });
      }

      setIsLiveConnected(true);
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowStr);
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Fitur D: Pengaturan Lembaga & Kop Surat Online
  const handleSavePengaturan = async (newSettings: PengaturanLembaga) => {
    setPengaturan(newSettings);
    const result = await saveOnlinePengaturan(newSettings, gasWebAppUrl);
    return result;
  };

  // Tarik Pengaturan Online dari Spreadsheet / Server
  const handleSyncPengaturan = async () => {
    setIsSyncingAll(true);
    try {
      const { pengaturan: liveSettings } = await fetchLivePengaturan();
      if (liveSettings && liveSettings.namaSekolah) {
        setPengaturan(prev => ({ ...prev, ...liveSettings }));
        return { success: true, count: 1, message: 'Pengaturan lembaga dan kop surat berhasil dimuat online!' };
      }
      return { success: false, message: 'Belum ada data pengaturan kustom di server/spreadsheet' };
    } catch (err: any) {
      console.error('Error syncing pengaturan:', err);
      throw err;
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Master Pelanggaran CRUD (Tersimpan Online ke Cloud & Spreadsheet)
  const handleSavePelanggaran = async (pel: JenisPelanggaran) => {
    setRefPelanggaranList(prev => {
      const idx = prev.findIndex(p => p.id === pel.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = pel;
        return copy;
      }
      return [pel, ...prev];
    });
    try {
      await saveRefPelanggaranOnline(pel);
    } catch (err) {
      console.error('Failed to save ref pelanggaran online:', err);
    }
  };

  const handleDeletePelanggaran = async (id: string) => {
    setRefPelanggaranList(prev => prev.filter(p => p.id !== id));
    try {
      await deleteRefPelanggaranOnline(id);
    } catch (err) {
      console.error('Failed to delete ref pelanggaran online:', err);
    }
  };

  const handleResetDefaultPelanggaran = () => {
    setRefPelanggaranList(INITIAL_PELANGGARAN_REF);
  };

  // Simpan URL Google Apps Script Web App ke Server Cloud
  const handleSaveGasWebAppUrl = async (url: string) => {
    setGasWebAppUrl(url);
    try {
      await saveGasUrlOnline(url);
    } catch (err) {
      console.error('Failed to save GAS url online:', err);
    }
  };

  // Kirim / Push Seluruh Data (Admin, Master Pelanggaran, Pengaturan) ke Google Sheets
  const handlePushAllToSheets = async () => {
    setIsSyncingAll(true);
    try {
      const res = await syncAllToGoogleSheets(gasWebAppUrl);
      return res;
    } catch (err: any) {
      console.error('Push to sheets error:', err);
      return { success: false, message: err?.message || 'Gagal mengirim ke spreadsheet' };
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pengaturan={pengaturan}
        isGuruLoggedIn={!!currentGuru}
        isAdminLoggedIn={!!currentAdmin}
        onGuruLogout={handleLogoutGuru}
        onAdminLogout={handleLogoutAdmin}
        isLiveConnected={isLiveConnected}
        totalMurid={muridList.length}
        totalGuru={guruList.length}
        onOpenConnectionModal={() => setConnectionModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Tab 1: Publik (Leaderboard) */}
        {activeTab === 'publik' && (
          <LeaderboardView
            muridList={muridList}
            logs={logs}
            pengaturan={pengaturan}
            onOpenReportPrint={(murid) => setPrintMurid(murid)}
          />
        )}

        {/* Tab 2: Form Input Pelanggaran (Guru) */}
        {activeTab === 'guru' && (
          <TeacherFormView
            guruList={guruList}
            muridList={muridList}
            refPelanggaranList={refPelanggaranList}
            currentGuru={currentGuru}
            onLoginGuru={handleLoginGuru}
            onLogoutGuru={handleLogoutGuru}
            onSubmitPelanggaran={handleSubmitPelanggaran}
          />
        )}

        {/* Tab 3: Panel Admin */}
        {activeTab === 'admin' && (
          <AdminPortalView
            admins={admins}
            guruList={guruList}
            muridList={muridList}
            logs={logs}
            pengaturan={pengaturan}
            currentAdmin={currentAdmin}
            refPelanggaranList={refPelanggaranList}
            onLoginAdmin={handleLoginAdmin}
            onLogoutAdmin={handleLogoutAdmin}
            onSaveAdmin={handleSaveAdmin}
            onDeleteAdmin={handleDeleteAdmin}
            onSaveGuru={handleSaveGuru}
            onDeleteGuru={handleDeleteGuru}
            onSaveMurid={handleSaveMurid}
            onDeleteMurid={handleDeleteMurid}
            onSavePelanggaran={handleSavePelanggaran}
            onDeletePelanggaran={handleDeletePelanggaran}
            onResetDefaultPelanggaran={handleResetDefaultPelanggaran}
            onSyncSpreadsheet={handleSyncSpreadsheet}
            onSyncGuruSpreadsheet={handleSyncGuruSpreadsheet}
            onSavePengaturan={handleSavePengaturan}
            onSyncPengaturan={handleSyncPengaturan}
            onOpenReportPrint={(murid) => setPrintMurid(murid)}
            gasWebAppUrl={gasWebAppUrl}
            onSaveGasWebAppUrl={handleSaveGasWebAppUrl}
            onOpenConnectionModal={() => setConnectionModalOpen(true)}
            isLiveConnected={isLiveConnected}
            lastSyncTime={lastSyncTime}
            onPushAllToSheets={handlePushAllToSheets}
          />
        )}

        {/* Tab 4: Dokumentasi & Skrip GAS */}
        {activeTab === 'gas' && (
          <GasDocsView />
        )}

      </main>

      {/* Printable Report Modal */}
      {printMurid && (
        <OfficialPrintModal
          murid={printMurid}
          logs={logs}
          pengaturan={pengaturan}
          onClose={() => setPrintMurid(null)}
        />
      )}

      {/* Connection & Live Spreadsheet Modal */}
      <ConnectionModal
        isOpen={connectionModalOpen}
        onClose={() => setConnectionModalOpen(false)}
        isLiveConnected={isLiveConnected}
        lastSyncTime={lastSyncTime}
        totalMurid={muridList.length}
        totalGuru={guruList.length}
        gasWebAppUrl={gasWebAppUrl}
        onSaveGasWebAppUrl={handleSaveGasWebAppUrl}
        onTriggerSyncAll={handleSyncAll}
        isSyncing={isSyncingAll}
        onPushAllToSheets={handlePushAllToSheets}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left">
            <p className="font-bold text-slate-300">
              {pengaturan.namaSekolah} &bull; Pasuruan, Jawa Timur
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sistem Jurnal Tata Tertib & Buku Saku Kedisiplinan Terpadu
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <button
              onClick={() => setConnectionModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Sheets ID: {SPREADSHEET_ID.slice(0, 10)}...</span>
            </button>
            <span>&bull;</span>
            <span className="font-mono text-slate-400">Drive: {DRIVE_FOLDER_ID.slice(0, 10)}...</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
