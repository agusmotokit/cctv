import React, { useState, useEffect, useRef } from 'react';
import { Camera, Menu, LogOut, LogIn, Search, Heart } from 'lucide-react';
import { type User } from 'firebase/auth';

interface NavbarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  user: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: 'map' | 'multiview';
  setViewMode: (mode: 'map' | 'multiview') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  user,
  onAuthClick,
  onLogout,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return (
    <header className="navbar-container">
      <div className="navbar-brand">
        <div className="brand-logo-wrapper">
          <Camera className="brand-icon" />
          <span className="brand-pulse-dot"></span>
        </div>
        <div className="brand-text">
          <h1>NUSANTARA<span>CCTV</span></h1>
          <p>Live Monitoring System</p>
        </div>
      </div>

      <div className="navbar-actions">
        {/* Search Popover */}
        <div className="navbar-search-wrapper" ref={searchWrapperRef}>
          <button
            id="nav-btn-search-toggle"
            className={`search-toggle-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Cari Kamera CCTV"
            aria-label="Cari Kamera CCTV"
          >
            <Search size={16} />
          </button>
          
          {isSearchOpen && (
            <div className="search-popup-dropdown">
              <div className="search-popup-arrow"></div>
              <div className="search-popup-input-wrapper">
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-popup-input"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        {/* Favorites Multi-View Toggle */}
        <button
          id="nav-btn-favorites-toggle"
          className={`favorites-toggle-btn ${viewMode === 'multiview' ? 'active' : ''}`}
          onClick={() => setViewMode(viewMode === 'map' ? 'multiview' : 'map')}
          title={viewMode === 'map' ? 'Buka Multi-View Favorit' : 'Kembali ke Peta'}
          aria-label={viewMode === 'map' ? 'Buka Multi-View Favorit' : 'Kembali ke Peta'}
        >
          <Heart size={16} />
        </button>

        {user ? (
          <>
            <span className="user-email-display" title={user.email || undefined}>{user.email}</span>
            <button
              id="nav-btn-logout"
              className="nav-action-btn logout-btn"
              onClick={onLogout}
              title="Keluar dari Akun"
            >
              <LogOut size={14} style={{ marginRight: '6px' }} />
              <span>Keluar</span>
            </button>
          </>
        ) : (
          <button
            id="nav-btn-login"
            className="nav-action-btn login-btn"
            onClick={onAuthClick}
            title="Masuk / Daftar Akun"
          >
            <LogIn size={14} style={{ marginRight: '6px' }} />
            <span>Masuk / Daftar</span>
          </button>
        )}
        <button
          id="nav-btn-menu"
          className={`menu-toggle-btn ${!isSidebarCollapsed ? 'active' : ''}`}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          title={isSidebarCollapsed ? "Tampilkan Filter Pemantauan" : "Sembunyikan Filter Pemantauan"}
          aria-label={isSidebarCollapsed ? "Tampilkan Filter Pemantauan" : "Sembunyikan Filter Pemantauan"}
        >
          <Menu className="menu-icon" />
        </button>
      </div>

      <style>{`
        .navbar-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 72px;
          padding: 0 24px;
          background: rgba(15, 22, 38, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .brand-logo-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          background: var(--accent-blue-glow);
          border: 1px solid var(--border-color-active);
          border-radius: var(--radius-sm);
          color: var(--accent-blue);
        }

        .brand-icon {
          width: 22px;
          height: 22px;
        }

        .brand-pulse-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background-color: var(--accent-green);
          border-radius: 50%;
          border: 2px solid var(--bg-secondary);
          animation: pulse-green 2s infinite;
        }

        .brand-text h1 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.05em;
          line-height: 1.1;
        }

        .brand-text h1 span {
          color: var(--accent-blue);
          margin-left: 2px;
        }

        .brand-text p {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .navbar-search {
          flex: 1;
          max-width: 400px;
          margin: 0 24px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
          width: 18px;
          height: 18px;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding-left: 44px !important;
          background: rgba(8, 12, 20, 0.4);
          border-radius: var(--radius-sm);
        }

        .navbar-menu {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px 16px;
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.04);
        }

        .nav-item.active {
          color: var(--accent-blue);
          background: var(--accent-blue-glow);
          border: 1px solid rgba(59, 130, 246, 0.15);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-action-btn {
          font-family: var(--font-body, sans-serif);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
        }

        .login-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }

        .login-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .add-cctv-btn {
          background: #0066ff;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
        }

        .add-cctv-btn:hover {
          background: #0052cc;
          box-shadow: 0 4px 16px rgba(0, 102, 255, 0.45);
          transform: translateY(-1px);
        }

        .logout-btn {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .user-email-display {
          font-size: 0.8rem;
          color: #94a3b8;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          padding-right: 12px;
          height: 16px;
          display: flex;
          align-items: center;
        }

        @media (max-width: 600px) {
          .navbar-container {
            padding: 0 12px;
            height: 60px;
          }

          .navbar-brand {
            gap: 8px;
          }

          .brand-logo-wrapper {
            width: 34px;
            height: 34px;
            border-radius: 6px;
          }

          .brand-icon {
            width: 18px;
            height: 18px;
          }

          .brand-text h1 {
            font-size: 0.95rem;
          }

          .brand-text p {
            font-size: 0.6rem;
          }

          .navbar-actions {
            gap: 6px;
          }

          .search-toggle-btn,
          .favorites-toggle-btn,
          .menu-toggle-btn,
          .login-btn,
          .logout-btn {
            width: 34px !important;
            height: 34px !important;
            min-width: 34px !important;
            padding: 0 !important;
            display: inline-flex !important;
            align-items: center;
            justify-content: center;
          }

          .login-btn span,
          .logout-btn span,
          .user-email-display {
            display: none !important;
          }

          .login-btn svg,
          .logout-btn svg {
            margin-right: 0 !important;
          }

          .search-popup-dropdown {
            width: calc(100vw - 24px) !important;
            max-width: 280px !important;
          }

          .search-popup-arrow {
            right: 12px !important;
          }
        }

        @media (max-width: 375px) {
          .brand-text p {
            display: none;
          }

          .brand-text h1 {
            font-size: 0.85rem;
          }

          .navbar-container {
            padding: 0 8px;
          }

          .navbar-actions {
            gap: 4px;
          }

          .brand-logo-wrapper {
            width: 30px;
            height: 30px;
          }

          .brand-icon {
            width: 16px;
            height: 16px;
          }

          .search-toggle-btn,
          .favorites-toggle-btn,
          .menu-toggle-btn,
          .login-btn,
          .logout-btn {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
          }

          .search-popup-arrow {
            right: 11px !important;
          }
        }

        .menu-toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 10px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .menu-toggle-btn:hover,
        .menu-toggle-btn.active {
          background: var(--accent-blue-glow);
          border-color: var(--border-color-active);
          color: var(--accent-blue);
        }

        .menu-icon {
          width: 20px;
          height: 20px;
        }

        .navbar-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .search-toggle-btn:hover,
        .search-toggle-btn.active {
          background: var(--accent-blue-glow);
          border-color: var(--border-color-active);
          color: var(--accent-blue);
        }

        .favorites-toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .favorites-toggle-btn:hover {
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.08);
        }

        .favorites-toggle-btn.active {
          color: #fff;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-color: #ef4444;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.35), 0 2px 8px rgba(239, 68, 68, 0.2);
          animation: favoritesPulse 2s infinite;
        }

        .favorites-toggle-btn.active:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.45), 0 2px 12px rgba(239, 68, 68, 0.3);
        }

        @keyframes favoritesPulse {
          0%, 100% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.35), 0 2px 8px rgba(239, 68, 68, 0.2); }
          50% { box-shadow: 0 0 22px rgba(239, 68, 68, 0.5), 0 2px 12px rgba(239, 68, 68, 0.35); }
        }

        .search-popup-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color-active);
          border-radius: var(--radius-sm);
          padding: 8px;
          width: 280px;
          box-shadow: var(--shadow-lg);
          z-index: 1010;
          animation: slideDownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .search-popup-arrow {
          position: absolute;
          bottom: 100%;
          right: 14px;
          width: 10px;
          height: 10px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color-active);
          border-left: 1px solid var(--border-color-active);
          transform: translateY(5px) rotate(45deg);
        }

        .search-popup-input-wrapper {
          width: 100%;
        }

        .search-popup-input {
          width: 100%;
          background: rgba(8, 12, 20, 0.6);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-family: var(--font-body);
          font-size: 0.875rem;
          outline: none;
          transition: all var(--transition-fast);
        }

        .search-popup-input:focus {
          border-color: var(--accent-blue);
          box-shadow: 0 0 0 2px var(--accent-blue-glow);
        }
      `}</style>
    </header>
  );
};
