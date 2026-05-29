import React, { useMemo } from 'react';
import { provinces, citiesByProvince, type CCTV } from '../data/cctvData';
import { MapPin, Power, Plus } from 'lucide-react';
import { type User } from 'firebase/auth';

interface SidebarProps {
  cctvs: CCTV[];
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;

  totalCount: number;
  onlineCount: number;
  offlineCount: number;
  user: User | null;
  onAddCctvClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  cctvs,
  isCollapsed,

  selectedCountry,
  setSelectedCountry,
  selectedProvince,
  setSelectedProvince,
  selectedCity,
  setSelectedCity,

  totalCount,
  onlineCount,
  offlineCount,
  user,
  onAddCctvClick
}) => {

  const handleClearFilters = () => {
    setSelectedCountry('Indonesia');
    setSelectedProvince('Jawa Tengah');
    setSelectedCity('Kota Semarang');
  };

  const availableCities = citiesByProvince[selectedProvince] || [];

  // Pre-compute online/offline counts per province and per city
  const { provinceCounts, cityCounts } = useMemo(() => {
    const pCounts: Record<string, { online: number; offline: number }> = {};
    const cCounts: Record<string, { online: number; offline: number }> = {};

    for (const cctv of cctvs) {
      // Province counts
      if (!pCounts[cctv.province]) pCounts[cctv.province] = { online: 0, offline: 0 };
      if (cctv.status === 'online') pCounts[cctv.province].online++;
      else pCounts[cctv.province].offline++;

      // City counts
      if (!cCounts[cctv.city]) cCounts[cctv.city] = { online: 0, offline: 0 };
      if (cctv.status === 'online') cCounts[cctv.city].online++;
      else cCounts[cctv.city].offline++;
    }

    return { provinceCounts: pCounts, cityCounts: cCounts };
  }, [cctvs]);

  const getProvinceLabel = (prov: string) => {
    const counts = provinceCounts[prov];
    if (!counts) return prov;
    return `${prov}  ( ${counts.online} / ${counts.offline} )`;
  };

  const getCityLabel = (city: string) => {
    const counts = cityCounts[city];
    if (!counts) return city;
    return `${city}  ( ${counts.online} / ${counts.offline} )`;
  };

  return (
    <aside className={`sidebar-container glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
      
      
      <div className="sidebar-content-wrapper">




      <div className="filter-section">
        <label className="filter-label">
          <MapPin size={14} />
          <span>Pilih Wilayah</span>
        </label>
        
        <div className="custom-select-wrapper" style={{ marginBottom: '8px' }}>
          <select
            id="country-select"
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedProvince('Semua Provinsi');
              setSelectedCity('Semua Kota');
            }}
            className="input-field select-input"
            aria-label="Pilih Negara"
          >
            <option value="Indonesia">Indonesia</option>
            <option value="Semua Negara">Semua Negara</option>
          </select>
        </div>

        <div className="custom-select-wrapper" style={{ marginBottom: '8px' }}>
          <select
            id="province-select"
            value={selectedProvince}
            onChange={(e) => {
              setSelectedProvince(e.target.value);
              setSelectedCity('Semua Kota'); // Reset city on province change
            }}
            className="input-field select-input"
            aria-label="Pilih Provinsi"
          >
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {getProvinceLabel(prov)}
              </option>
            ))}
          </select>
        </div>

        {selectedProvince !== 'Semua Provinsi' && availableCities.length > 0 && (
          <div className="custom-select-wrapper">
            <select
              id="city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="input-field select-input"
              aria-label="Pilih Kota atau Kabupaten"
            >
              <option value="Semua Kota">Semua Kota/Kabupaten</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  {getCityLabel(city)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>


      <div className="sidebar-stats">
        <div className="stats-header">
          <Power size={14} />
          <span>Statistik Pemantauan</span>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{totalCount}</span>
            <span className="stat-label">Total CCTV</span>
          </div>
          <div className="stat-card online">
            <span className="stat-value">{onlineCount}</span>
            <span className="stat-label">Online</span>
          </div>
          <div className="stat-card offline">
            <span className="stat-value">{offlineCount}</span>
            <span className="stat-label">Offline</span>
          </div>
        </div>
      </div>

        <button
          id="btn-clear-filters"
          className="btn-secondary clear-filters-btn"
          onClick={handleClearFilters}
          aria-label="Reset Filter"
        >
          Reset Filter
        </button>

        {user && (
          <button
            id="sidebar-btn-add-cctv"
            className="btn-primary add-cctv-btn"
            onClick={onAddCctvClick}
            aria-label="Tambah CCTV Baru"
          >
            <Plus size={14} style={{ marginRight: '6px' }} />
            <span>Tambah CCTV</span>
          </button>
        )}
      </div>

      <style>{`
        .sidebar-container {
          position: relative;
          z-index: 1005; /* Ensure it stays above Leaflet map (1000) so its children remain visible */
          width: 320px;
          display: flex;
          flex-direction: column;
          border-radius: 0;
          border-right: none;
          border-top: none;
          border-bottom: none;
          background: rgba(15, 22, 38, 0.4);
          height: 100%;
          transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-left-width 0.35s ease;
          overflow: visible;
          border-left: 1px solid var(--border-color);
        }

        .sidebar-container.collapsed {
          width: 0;
          border-left-width: 0px;
          border-left-color: transparent;
        }

        .sidebar-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 24px;
          width: 320px;
          height: 100%;
          overflow-y: auto;
          box-sizing: border-box;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          flex-shrink: 0;
        }

        .sidebar-container.collapsed .sidebar-content-wrapper {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .sidebar-toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sidebar-toggle-btn:hover {
          color: var(--text-primary);
        }

        .sidebar-toggle-btn.inline {
          margin-left: auto;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .sidebar-toggle-btn.inline:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .sidebar-toggle-btn.floating {
          position: absolute;
          left: -24px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1010; /* Above Leaflet controls */
          width: 24px;
          height: 56px;
          border-radius: 12px 0 0 12px;
          background: rgba(15, 22, 38, 0.9);
          box-shadow: -4px 0 16px rgba(0, 0, 0, 0.4);
          border: 1px solid var(--border-color);
          border-right: none;
          animation: slideInToggle 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .sidebar-toggle-btn.floating:hover {
          background: var(--bg-tertiary);
          color: var(--accent-blue);
          border-color: var(--accent-blue-glow);
          width: 28px;
          left: -28px;
        }

        @keyframes slideInToggle {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(10px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 14px;
        }

        .sidebar-header h2 {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .sidebar-header-icon {
          color: var(--accent-blue);
        }

        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .filter-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .custom-select-wrapper {
          position: relative;
          width: 100%;
        }

        .select-input {
          width: 100%;
          appearance: none;
          cursor: pointer;
          padding-right: 32px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 14px;
        }


        .toggle-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .toggle-container {
          display: flex;
          align-items: center;
          position: relative;
          padding-left: 28px;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--text-primary);
          user-select: none;
        }

        .toggle-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          height: 0;
          width: 0;
        }

        .checkmark {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          height: 18px;
          width: 18px;
          background-color: rgba(8, 12, 20, 0.6);
          border: 1px solid var(--border-color);
          border-radius: 4px;
          transition: all var(--transition-fast);
        }

        .toggle-container:hover input ~ .checkmark {
          border-color: var(--text-secondary);
        }

        .toggle-container input:checked ~ .checkmark {
          background-color: var(--accent-blue);
          border-color: var(--accent-blue);
        }

        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }

        .toggle-container input:checked ~ .checkmark:after {
          display: block;
        }

        .toggle-container .checkmark:after {
          left: 6px;
          top: 2px;
          width: 4px;
          height: 9px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .toggle-text {
          font-size: 0.85rem;
          color: var(--text-secondary);
          transition: color var(--transition-fast);
        }

        .toggle-container:hover .toggle-text {
          color: var(--text-primary);
        }

        .sidebar-stats {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px solid var(--border-color);
          padding-top: 20px;
        }

        .stats-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
        }

        .stat-card .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          font-family: var(--font-heading);
          color: var(--text-primary);
        }

        .stat-card .stat-label {
          font-size: 0.65rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }

        .stat-card.online .stat-value {
          color: var(--accent-green);
        }

        .stat-card.offline .stat-value {
          color: var(--accent-red);
        }

        .clear-filters-btn {
          width: 100%;
          font-size: 0.8rem;
          padding: 8px 12px;
        }

        .add-cctv-btn {
          width: 100%;
          font-size: 0.8rem;
          padding: 8px 12px;
          margin-top: 12px;
          background: #0066ff;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.25);
        }

        .add-cctv-btn:hover {
          background: #0052cc;
          box-shadow: 0 4px 16px rgba(0, 102, 255, 0.45);
          transform: translateY(-1px);
        }

        .add-cctv-btn:active {
          transform: translateY(1px);
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .sidebar-search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-secondary);
          width: 16px;
          height: 16px;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding-left: 38px !important;
          background: rgba(8, 12, 20, 0.4);
          border-radius: var(--radius-sm);
        }
      `}</style>
    </aside>
  );
};
