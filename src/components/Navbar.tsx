import React from 'react';
import { Camera, Menu, LogOut, LogIn } from 'lucide-react';
import { type User } from 'firebase/auth';

interface NavbarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  user: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  user,
  onAuthClick,
  onLogout
}) => {
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
          .user-email-display {
            display: none;
          }
          .add-cctv-btn span, .logout-btn span {
            display: none;
          }
          .add-cctv-btn, .logout-btn {
            padding: 8px;
          }
          .add-cctv-btn svg, .logout-btn svg {
            margin-right: 0 !important;
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
      `}</style>
    </header>
  );
};
