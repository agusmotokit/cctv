import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { type CCTV } from './data/cctvData';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import { AuthModal } from './components/AuthModal';
import { AdminCctvModal } from './components/AdminCctvModal';

const LeafletMap = lazy(() => import('./components/LeafletMap'));

export const App: React.FC = () => {
  // CCTV Database state
  const [cctvs, setCctvs] = useState<CCTV[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auth and Admin States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAdminCctvModal, setShowAdminCctvModal] = useState<boolean>(false);
  const [cctvToEdit, setCctvToEdit] = useState<CCTV | null>(null);
  const [pendingCCTVToPlay, setPendingCCTVToPlay] = useState<CCTV | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('Indonesia');
  const [selectedProvince, setSelectedProvince] = useState<string>('DI Yogyakarta');
  const [selectedCity, setSelectedCity] = useState<string>('Kab. Bantul');
  const [showOnlyOnline, setShowOnlyOnline] = useState<boolean>(false);
  const [activeFilterFavorites, setActiveFilterFavorites] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true);

  // Play Camera Action (Used to center/track active map selection)
  const [playingCCTV, setPlayingCCTV] = useState<CCTV | null>(null);

  // Listen to Auth State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
      } else {
        setToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch CCTV data on mount
  useEffect(() => {
    fetch('/api/cctvs')
      .then(res => res.json())
      .then((data: CCTV[]) => {
        setCctvs(data);
        setIsLoading(false);
        // Find default CCTV after data loads if nothing is playing yet
        const defaultCam = data.find(c => c.id === 'bantul-14') || null;
        setPlayingCCTV(defaultCam);
      })
      .catch(err => {
        console.error('Failed to fetch CCTV data:', err);
        setIsLoading(false);
      });
  }, []);

  // Favorites (Stored in LocalStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('nusantara_cctv_favs');
    return saved ? JSON.parse(saved) : [];
  });

  // History (Stored in LocalStorage)
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('nusantara_cctv_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Save favorites to LocalStorage
  useEffect(() => {
    localStorage.setItem('nusantara_cctv_favs', JSON.stringify(favorites));
  }, [favorites]);

  // Save history to LocalStorage
  useEffect(() => {
    localStorage.setItem('nusantara_cctv_history', JSON.stringify(history));
  }, [history]);

  // Filter CCTV logic
  const filteredCCTVs = cctvs.filter((cctv) => {
    const matchesSearch = 
      cctv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cctv.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cctv.province.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCountry = selectedCountry === 'Semua Negara' || selectedCountry === 'Indonesia';
    const matchesProvince = selectedProvince === 'Semua Provinsi' || cctv.province === selectedProvince;
    const matchesCity = selectedCity === 'Semua Kota' || cctv.city === selectedCity;
    const matchesOnline = !showOnlyOnline || cctv.status === 'online';
    const matchesFavorites = !activeFilterFavorites || favorites.includes(cctv.id);

    return matchesCountry && matchesSearch && matchesProvince && matchesCity && matchesOnline && matchesFavorites;
  });

  // Statistics
  const totalCount = cctvs.length;
  const onlineCount = cctvs.filter(c => c.status === 'online').length;
  const offlineCount = cctvs.filter(c => c.status === 'offline').length;

  // Toggle Favorite Action
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  // Play Camera Action (called when marker is selected)
  const handlePlayCCTV = useCallback((cctv: CCTV | null) => {
    console.log('[App] handlePlayCCTV called with:', cctv?.name, 'user:', user?.email);
    if (cctv && cctv.id !== 'bantul-14' && !user) {
      console.log('[App] Restricted camera, set pending to:', cctv.name);
      setPendingCCTVToPlay(cctv);
      setShowAuthModal(true);
      return;
    }
    console.log('[App] Play camera directly:', cctv?.name);
    setPlayingCCTV(cctv);
    
    if (cctv) {
      // Add to history (limit to last 4, keep unique)
      setHistory((prev) => {
        const filtered = prev.filter(histId => histId !== cctv.id);
        return [cctv.id, ...filtered].slice(0, 4);
      });
    }
  }, [user]);



  // Auth & CRUD handlers
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSaveCCTV = async (cctvDataToSave: Omit<CCTV, 'id'> & { id?: string }) => {
    if (!token) {
      throw new Error('Anda harus login terlebih dahulu.');
    }

    const isEditing = !!cctvDataToSave.id;
    const url = isEditing ? `/api/cctvs/${cctvDataToSave.id}` : '/api/cctvs';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(cctvDataToSave)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Gagal menyimpan data CCTV.');
    }

    const savedCCTV = await res.json();
    
    // Update local state cctvs
    setCctvs(prev => {
      if (isEditing) {
        return prev.map(c => c.id === savedCCTV.id ? savedCCTV : c);
      } else {
        return [...prev, savedCCTV];
      }
    });

    // Update playing CCTV if it was edited
    if (playingCCTV && playingCCTV.id === savedCCTV.id) {
      setPlayingCCTV(savedCCTV);
    }
  };

  const handleDeleteCCTV = async (cctvId: string) => {
    if (!token) {
      alert('Anda harus login terlebih dahulu.');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin menghapus kamera CCTV ini?')) {
      return;
    }

    const res = await fetch(`/api/cctvs/${cctvId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      alert(errData.message || 'Gagal menghapus data CCTV.');
      return;
    }

    // Update local state
    setCctvs(prev => prev.filter(c => c.id !== cctvId));

    if (playingCCTV && playingCCTV.id === cctvId) {
      setPlayingCCTV(null);
    }
  };

  const handleOpenEditCCTV = (cctv: CCTV) => {
    setCctvToEdit(cctv);
    setShowAdminCctvModal(true);
  };

  const handleOpenAddCCTV = () => {
    setCctvToEdit(null);
    setShowAdminCctvModal(true);
  };

  if (isLoading) {
    return (
      <div className="app-loading-screen">
        <div className="premium-spinner-container">
          <div className="pulsing-logo">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#0066ff"/>
            </svg>
          </div>
          <div className="spinner-progress-bar">
            <div className="progress-fill"></div>
          </div>
          <span className="loading-text">Menghubungkan ke Server CCTV Nusantara...</span>
        </div>
        <style>{`
          .app-loading-screen {
            position: fixed;
            inset: 0;
            background: #0b0f19;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: 'Outfit', sans-serif;
          }
          .premium-spinner-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }
          .pulsing-logo {
            animation: pulse-logo 2s ease-in-out infinite;
          }
          @keyframes pulse-logo {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 15px rgba(0, 102, 255, 0.6)); }
          }
          .spinner-progress-bar {
            width: 240px;
            height: 4px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 2px;
            overflow: hidden;
            position: relative;
          }
          .progress-fill {
            height: 100%;
            width: 50%;
            background: linear-gradient(90deg, #0066ff, #00f2fe);
            border-radius: 2px;
            position: absolute;
            animation: loading-bar 1.5s infinite ease-in-out;
          }
          @keyframes loading-bar {
            0% { left: -50%; }
            100% { left: 100%; }
          }
          .loading-text {
            color: #94a3b8;
            font-size: 14px;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {/* View Workspace */}
        <div className="view-workspace">
          <div className="map-layout">
            <Suspense fallback={
              <div className="map-loading-placeholder">
                <div className="spinner"></div>
                <span>Memuat Peta Pemantauan...</span>
              </div>
            }>
              <LeafletMap
                cctvs={filteredCCTVs}
                onSelectCCTV={handlePlayCCTV}
                selectedCCTV={playingCCTV}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                selectedProvince={selectedProvince}
                selectedCity={selectedCity}
                user={user}
                onEditCCTV={handleOpenEditCCTV}
                onDeleteCCTV={handleDeleteCCTV}
              />
            </Suspense>
          </div>
        </div>

        <Sidebar
          cctvs={cctvs}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          selectedCity={selectedCity}
          setSelectedCity={setSelectedCity}
          showOnlyOnline={showOnlyOnline}
          setShowOnlyOnline={setShowOnlyOnline}
          activeFilterFavorites={activeFilterFavorites}
          setActiveFilterFavorites={setActiveFilterFavorites}
          totalCount={totalCount}
          onlineCount={onlineCount}
          offlineCount={offlineCount}
          user={user}
          onAddCctvClick={handleOpenAddCCTV}
        />
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={(loginSuccess) => {
          console.log('[App] AuthModal onClose called. success:', loginSuccess);
          setShowAuthModal(false);
          if (loginSuccess) {
            if (pendingCCTVToPlay) {
              console.log('[App] Redirecting playingCCTV to pending:', pendingCCTVToPlay.name);
              setPlayingCCTV(pendingCCTVToPlay);
              setPendingCCTVToPlay(null);
            }
          } else {
            console.log('[App] Clearing pending CCTV');
            setPendingCCTVToPlay(null);
          }
        }}
      />

      <AdminCctvModal
        isOpen={showAdminCctvModal}
        onClose={() => setShowAdminCctvModal(false)}
        onSave={handleSaveCCTV}
        cctvToEdit={cctvToEdit}
      />

      <style>{`
        .view-workspace {
          flex: 1;
          min-height: 0;
          height: 100%;
          overflow: hidden;
          background: rgba(8, 12, 20, 0.2);
          display: flex;
          flex-direction: column;
        }

        /* Map Layout */
        .map-layout {
          width: 100%;
          height: calc(100vh - 72px);
          padding: 16px;
          box-sizing: border-box;
        }

        .map-loading-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: rgba(15, 22, 38, 0.4);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-family: var(--font-body);
        }

        .map-loading-placeholder .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.05);
          border-top-color: var(--accent-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
