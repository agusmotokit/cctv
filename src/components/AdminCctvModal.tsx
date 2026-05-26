import React, { useState, useEffect } from 'react';
import { provinces, citiesByProvince, type CCTV } from '../data/cctvData';
import { X, Save, AlertCircle } from 'lucide-react';

interface AdminCctvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cctv: Omit<CCTV, 'id'> & { id?: string }) => Promise<void>;
  cctvToEdit: CCTV | null;
}

export const AdminCctvModal: React.FC<AdminCctvModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cctvToEdit
}) => {
  const [name, setName] = useState<string>('');
  const [province, setProvince] = useState<string>('Jawa Barat');
  const [city, setCity] = useState<string>('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [category, setCategory] = useState<'traffic' | 'public' | 'tourism'>('traffic');
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Load existing CCTV data for editing
  useEffect(() => {
    if (cctvToEdit) {
      setName(cctvToEdit.name);
      setProvince(cctvToEdit.province);
      setCity(cctvToEdit.city);
      setLat(cctvToEdit.lat.toString());
      setLng(cctvToEdit.lng.toString());
      setStreamUrl(cctvToEdit.streamUrl);
      setCategory(cctvToEdit.category);
      setStatus(cctvToEdit.status);
      setDescription(cctvToEdit.description || '');
    } else {
      // Set defaults for a new CCTV
      setName('');
      setProvince('DI Yogyakarta');
      setCity('Kab. Bantul');
      setLat('-7.889');
      setLng('110.328');
      setStreamUrl('');
      setCategory('traffic');
      setStatus('online');
      setDescription('');
    }
    setError('');
  }, [cctvToEdit, isOpen]);

  // Adjust city if province changes
  const filteredProvinces = provinces.filter(p => p !== 'Semua Provinsi');
  const availableCities = citiesByProvince[province] || [];

  useEffect(() => {
    if (!cctvToEdit && availableCities.length > 0) {
      setCity(availableCities[0]);
    }
  }, [province, cctvToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      setError('Latitude harus berupa angka antara -90 dan 90.');
      return;
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      setError('Longitude harus berupa angka antara -180 dan 180.');
      return;
    }
    if (!streamUrl.trim()) {
      setError('URL stream harus diisi.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        id: cctvToEdit?.id,
        name: name.trim(),
        province,
        city,
        lat: latitude,
        lng: longitude,
        streamUrl: streamUrl.trim(),
        category,
        status,
        description: description.trim()
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to save CCTV:', err);
      setError(err.message || 'Gagal menyimpan data CCTV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-card glass-panel animate-fade-in" id="admin-modal-dialog">
        <button className="close-btn" onClick={onClose} aria-label="Tutup form">
          <X size={18} />
        </button>

        <div className="admin-modal-header">
          <h2>{cctvToEdit ? 'Ubah Informasi CCTV' : 'Tambah Kamera CCTV Baru'}</h2>
          <p className="admin-modal-subtitle">
            {cctvToEdit ? 'Ubah informasi detail untuk kamera yang terdaftar' : 'Masukkan parameter detail untuk menambahkan kamera ke peta'}
          </p>
        </div>

        {error && (
          <div className="admin-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="cctv-name">Nama Kamera / Lokasi</label>
              <input
                id="cctv-name"
                type="text"
                placeholder="Contoh: Simpang Gondomanan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label htmlFor="cctv-province">Provinsi</label>
              <select
                id="cctv-province"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="input-field select-input"
              >
                {filteredProvinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="cctv-city">Kota / Kabupaten</label>
              {availableCities.length > 0 ? (
                <select
                  id="cctv-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-field select-input"
                >
                  {availableCities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="cctv-city-input"
                  type="text"
                  placeholder="Nama kota/kabupaten"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="input-field"
                />
              )}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label htmlFor="cctv-lat">Latitude Koordinat</label>
              <input
                id="cctv-lat"
                type="text"
                placeholder="-7.889"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                required
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label htmlFor="cctv-lng">Longitude Koordinat</label>
              <input
                id="cctv-lng"
                type="text"
                placeholder="110.328"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="cctv-stream">URL Streaming (HLS/M3U8/FLV/WebSocket)</label>
            <input
              id="cctv-stream"
              type="text"
              placeholder="http://example.com/live/stream.m3u8"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label htmlFor="cctv-category">Kategori Kamera</label>
              <select
                id="cctv-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="input-field select-input"
              >
                <option value="traffic">Lalu Lintas</option>
                <option value="public">Area Publik</option>
                <option value="tourism">Destinasi Wisata</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="cctv-status">Status Kamera</label>
              <select
                id="cctv-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="input-field select-input"
              >
                <option value="online">Online</option>
                <option value="offline">Offline / Maintenance</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="cctv-desc">Deskripsi Singkat</label>
            <textarea
              id="cctv-desc"
              rows={2}
              placeholder="Masukkan informasi tambahan terkait kamera ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field textarea-field"
            />
          </div>

          <button 
            id="admin-save-cctv-btn"
            type="submit" 
            className="btn-primary admin-save-btn" 
            disabled={loading}
          >
            <Save size={16} />
            <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </form>
      </div>

      <style>{`
        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 12, 20, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: var(--font-body, sans-serif);
          padding: 16px;
        }

        .admin-modal-card {
          width: 100%;
          max-width: 520px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px 24px;
          position: relative;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.05);
          max-height: 90vh;
          overflow-y: auto;
        }

        .admin-modal-card .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #94a3b8;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .admin-modal-card .close-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
          transform: rotate(90deg);
        }

        .admin-modal-header {
          margin-bottom: 20px;
        }

        .admin-modal-header h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #f8fafc;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .admin-modal-subtitle {
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.4;
        }

        .admin-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 20px;
        }

        .admin-modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 480px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .admin-modal-form .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-modal-form .input-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-modal-form .input-field {
          width: 100%;
          padding: 10px 12px;
          background: rgba(8, 12, 20, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          color: #f8fafc;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .admin-modal-form .input-field:focus {
          border-color: #0066ff;
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.15);
          background: rgba(8, 12, 20, 0.7);
        }

        .admin-modal-form .select-input {
          appearance: none;
          cursor: pointer;
          padding-right: 32px;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a1a1aa'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          background-size: 14px;
        }

        .admin-modal-form .textarea-field {
          resize: vertical;
          font-family: inherit;
        }

        .admin-save-btn {
          width: 100%;
          padding: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .animate-fade-in {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};
