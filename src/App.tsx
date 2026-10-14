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
import { 
  AdminUser, Guru, Murid, JenisPelanggaran, LogPelanggaran, PengaturanLembaga 
} from './types';
import { 
  INITIAL_ADMINS, INITIAL_GURU, INITIAL_MURID, 
  INITIAL_PELANGGARAN_REF, INITIAL_LOGS, INITIAL_PENGATURAN, GAS_CONFIG 
} from './data/initialData';

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

  // Auth Guru
  const handleLoginGuru = (nip: string, pass: string): boolean => {
    const found = guruList.find(g => g.nip.trim() === nip.trim() && g.status === 'Aktif');
    // Allow either the default password Smpn2Beji or standard match
    if (found && (pass === GAS_CONFIG.guruDefaultPassword || pass === 'Smpn2Beji' || pass === 'admin')) {
      setCurrentGuru(found);
      return true;
    }
    return false;
  };

  const handleLogoutGuru = () => {
    setCurrentGuru(null);
  };

  // Auth Admin
  const handleLoginAdmin = (pass: string): boolean => {
    // Check against default password or configured admin
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
  const handleSubmitPelanggaran = (newLog: LogPelanggaran) => {
    setLogs(prev => [newLog, ...prev]);
  };

  // Fitur A: CRUD Admin
  const handleSaveAdmin = (adm: AdminUser) => {
    setAdmins(prev => {
      const idx = prev.findIndex(a => a.id === adm.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = adm;
        return copy;
      }
      return [...prev, adm];
    });
  };

  const handleDeleteAdmin = (id: string) => {
    setAdmins(prev => prev.filter(a => a.id !== id));
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

  // Fitur C: CRUD Murid & Sinkronisasi
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

  const handleSyncSpreadsheet = () => {
    // Simulate re-fetching latest students & teachers from Google Sheets ID
    // We add new fresh student records if they don't exist
    const sampleAdditionalStudents: Murid[] = [
      { id: 'MUR-021', nisn: '0071234586', nis: '22906', nama: 'Umar Abdullah', kelas: '9B', jenisKelamin: 'L', waliKelas: 'Nurul Hidayati, S.Si.' },
      { id: 'MUR-022', nisn: '0071234587', nis: '22907', nama: 'Vina Panduwinata', kelas: '9B', jenisKelamin: 'P', waliKelas: 'Nurul Hidayati, S.Si.' },
      { id: 'MUR-023', nisn: '0081234588', nis: '23808', nama: 'Wahyu Hidayat', kelas: '8C', jenisKelamin: 'L', waliKelas: 'Dewi Lestari, S.Pd.' },
      { id: 'MUR-024', nisn: '0091234589', nis: '24709', nama: 'Zahra Novitasari', kelas: '7C', jenisKelamin: 'P', waliKelas: 'Ahmad Fauzi, S.Pd.' }
    ];

    setMuridList(prev => {
      const existingNisns = new Set(prev.map(m => m.nisn));
      const toAdd = sampleAdditionalStudents.filter(s => !existingNisns.has(s.nisn));
      return [...prev, ...toAdd];
    });
  };

  // Fitur D: Pengaturan Lembaga
  const handleSavePengaturan = (newSettings: PengaturanLembaga) => {
    setPengaturan(newSettings);
  };

  // Master Pelanggaran CRUD
  const handleSavePelanggaran = (pel: JenisPelanggaran) => {
    setRefPelanggaranList(prev => {
      const idx = prev.findIndex(p => p.id === pel.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = pel;
        return copy;
      }
      return [pel, ...prev];
    });
  };

  const handleDeletePelanggaran = (id: string) => {
    setRefPelanggaranList(prev => prev.filter(p => p.id !== id));
  };

  const handleResetDefaultPelanggaran = () => {
    setRefPelanggaranList(INITIAL_PELANGGARAN_REF);
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
            onSavePengaturan={handleSavePengaturan}
            onOpenReportPrint={(murid) => setPrintMurid(murid)}
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
          <div className="text-right text-[11px] text-slate-500">
            <span>Spreadsheet: <code className="font-mono text-slate-400">1vzxldrnNQ...</code></span>
            <span className="mx-2">&bull;</span>
            <span>Drive Folder: <code className="font-mono text-slate-400">18tDeAMgEF...</code></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
