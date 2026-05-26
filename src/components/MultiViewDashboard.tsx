import React, { useState, useEffect, useMemo, useRef } from 'react';
import Hls from 'hls.js';
import flvjs from 'flv.js';
import JSMpeg from '@cycjimmy/jsmpeg-player';
import { type CCTV } from '../data/cctvData';
import { Heart, LayoutGrid, Map, Volume2, VolumeX, X, AlertTriangle } from 'lucide-react';

// Lightweight player component for a single grid slot
interface MultiVideoCellPlayerProps {
  cctv: CCTV;
  onClear: () => void;
}

const MultiVideoCellPlayer: React.FC<MultiVideoCellPlayerProps> = ({ cctv, onClear }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const jsmpegCanvasRef = useRef<HTMLDivElement>(null);
  const jsmpegPlayerRef = useRef<{ destroy?: () => void } | null>(null);

  const isMjpeg = cctv.streamUrl.includes('nph-zms') || cctv.streamUrl.includes('cgi-bin/nph-zms') || cctv.streamUrl.includes('jombangkab.go.id');
  const isJsmpeg = cctv.streamUrl.includes('streamer-jsmpeg') || cctv.streamUrl.includes('villabs.id/streamer');
  const isFlv = !isJsmpeg && (cctv.streamUrl.startsWith('wss://') || cctv.streamUrl.startsWith('ws://') || cctv.streamUrl.endsWith('.flv'));
  const isYoutube = cctv.streamUrl.includes('youtube.com') || cctv.streamUrl.includes('youtu.be');
  const isIframe = isYoutube || cctv.streamUrl.includes('smartcctv.wonogirikab.go.id') || cctv.streamUrl.includes('.html');
  const isMp4 = cctv.streamUrl.includes('.mp4');
  const isPurwakarta = cctv.id.startsWith('purwakarta-');

  // Compute initial error/loaded state synchronously (not inside useEffect)
  const isInitiallyOffline = cctv.status === 'offline' || (isIframe && (cctv.streamUrl === 'https://www.youtube.com/embed/' || cctv.streamUrl.endsWith('/embed/') || cctv.streamUrl === ''));

  const [isLoaded, setIsLoaded] = useState(isInitiallyOffline);
  const [hasError, setHasError] = useState(isInitiallyOffline);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    let active = true;
    const cleanups: (() => void)[] = [];

    if (isInitiallyOffline) return;

    if (isMjpeg) return;

    if (isIframe) {
      return;
    }

    if (isJsmpeg) {
      const wrapper = jsmpegCanvasRef.current;
      if (!wrapper) return;
      wrapper.innerHTML = '';

      try {
        const player = new (JSMpeg as unknown as { VideoElement: new (...args: unknown[]) => { destroy?: () => void } }).VideoElement(
          wrapper,
          cctv.streamUrl,
          {
            canvas: '',
            autoplay: true,
            control: false,
            loop: false,
            decodeFirstFrame: true,
            poster: '',
            hooks: {
              load: () => {
                if (active) {
                  setIsLoaded(true);
                }
              }
            }
          },
          {
            video: { preserveDrawingBuffer: true },
            audio: false,
            disableWebAssembly: false
          }
        );
        jsmpegPlayerRef.current = player;

        const loadTimeout = setTimeout(() => {
          if (active) {
            setIsLoaded(true);
          }
        }, 2000);

        return () => {
          active = false;
          clearTimeout(loadTimeout);
          if (player && player.destroy) {
            player.destroy();
          }
          jsmpegPlayerRef.current = null;
        };
      } catch (e) {
        console.error('Failed to init JSMpeg player inside MultiView:', e);
        setHasError(true);
        setIsLoaded(true);
        return;
      }
    }

    if (isPurwakarta) {
      const video = videoRef.current;
      if (!video) return;

      const camId = cctv.id.replace('purwakarta-', '');
      const wsUrl = `wss://cctv.purwakartakab.go.id/go2rtc/api/ws?src=${camId}`;

      let ws: WebSocket | null = null;
      let ms: MediaSource | null = null;
      let sb: SourceBuffer | null = null;
      let reconnectTID: ReturnType<typeof setTimeout> | null = null;
      let isPlayingStarted = false;
      const buffer = new Uint8Array(2 * 1024 * 1024);
      let bufferLength = 0;

      const codecs = ["avc1.640029", "avc1.64002A", "avc1.640033", "hvc1.1.6.L153.B0", "mp4a.40.2", "mp4a.40.5", "flac", "opus"];
      const getSupportedCodecs = () => {
        return codecs.filter(codec => MediaSource.isTypeSupported(`video/mp4; codecs="${codec}"`)).join(',');
      };

      const cleanup = () => {
        if (reconnectTID) {
          clearTimeout(reconnectTID);
          reconnectTID = null;
        }
        if (ws) {
          ws.onclose = null;
          ws.onerror = null;
          ws.onmessage = null;
          ws.close();
          ws = null;
        }
        ms = null;
        sb = null;
        try {
          video.src = '';
          video.srcObject = null;
        } catch { /* ignore cleanup errors */ }
      };

      const connect = () => {
        if (!active || !("MediaSource" in window)) return;

        ms = new MediaSource();
        video.src = URL.createObjectURL(ms);

        ms.addEventListener('sourceopen', () => {
          if (!active || !ms) return;
          URL.revokeObjectURL(video.src);

          ws = new WebSocket(wsUrl);
          ws.binaryType = 'arraybuffer';

          ws.onopen = () => {
            if (!active || !ws) return;
            ws.send(JSON.stringify({ type: 'mse', value: getSupportedCodecs() }));
          };

          ws.onmessage = (event) => {
            if (!active || !ms) return;
            if (typeof event.data === 'string') {
              const msg = JSON.parse(event.data);
              if (msg.type === 'mse' && msg.value && ms.readyState === 'open') {
                try {
                  sb = ms.addSourceBuffer(msg.value);
                  sb.mode = 'segments';
                  sb.addEventListener('updateend', () => {
                    if (!active || !sb || !ms || ms.readyState !== 'open') return;
                    if (!sb.updating && bufferLength > 0) {
                      try {
                        sb.appendBuffer(buffer.slice(0, bufferLength));
                        bufferLength = 0;
                      } catch (e) {
                        console.warn('[PurwakartaPlayer] appendBuffer error:', e);
                      }
                    }
                  });
                } catch { /* ignore addSourceBuffer errors */ }
              }
            } else if (sb) {
              if (!isPlayingStarted) {
                isPlayingStarted = true;
                video.play().catch(() => {
                  video.muted = true;
                  video.play().catch(() => {});
                });
              }
              if (sb.updating || bufferLength > 0) {
                const data = new Uint8Array(event.data);
                buffer.set(data, bufferLength);
                bufferLength += data.byteLength;
              } else {
                try {
                  sb.appendBuffer(event.data);
                } catch { /* ignore appendBuffer errors */ }
              }
            }
          };

          ws.onclose = () => {
            if (!active) return;
            reconnectTID = setTimeout(() => {
              cleanup();
              connect();
            }, 3000);
          };

          ws.onerror = () => {
            if (active) {
              setHasError(true);
            }
          };
        }, { once: true });
      };

      connect();
      return () => cleanup();
    }

    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => {
      if (active) setIsLoaded(true);
    };
    video.addEventListener('playing', handlePlaying);
    cleanups.push(() => video.removeEventListener('playing', handlePlaying));

    let hls: Hls | null = null;
    let flvPlayer: flvjs.Player | null = null;

    const initPlayer = async () => {
      let streamUrl = cctv.streamUrl;
      
      // Gresik & Surabaya stream starters
      if (cctv.id.startsWith('gresik-')) {
        const rawId = cctv.id.replace('gresik-', '');
        fetch('/gresik-api/rpc/cctv/startStreamById', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer default-token'
          },
          body: JSON.stringify({ json: { id: rawId } })
        }).catch(() => {});
      }

      if (cctv.id.startsWith('surabaya-')) {
        const rawId = cctv.id.replace('surabaya-', '');
        fetch(`/surabaya-api/api/start_stream/${rawId}`, { method: 'POST' }).catch(() => {});
      }

      // Proxy mappings
      if (streamUrl.startsWith('https://testing-apicctv.gresikkab.go.id')) {
        streamUrl = streamUrl.replace('https://testing-apicctv.gresikkab.go.id', '/gresik-api');
      } else if (streamUrl.startsWith('https://live.banyuwangikab.go.id/hls/')) {
        streamUrl = streamUrl.replace('https://live.banyuwangikab.go.id/hls/', '/bwi-hls/');
      } else if (streamUrl.startsWith('https://atcs.banjarmasinkota.go.id/stream/')) {
        streamUrl = streamUrl.replace('https://atcs.banjarmasinkota.go.id/stream/', '/bjm-stream/');
      } else if (streamUrl.startsWith('https://streaming.patikab.go.id/memfs/')) {
        streamUrl = streamUrl.replace('https://streaming.patikab.go.id/memfs/', '/pati-stream/memfs/');
      } else if (streamUrl.startsWith('https://dishub.cradnu.com/memfs/')) {
        streamUrl = streamUrl.replace('https://dishub.cradnu.com/memfs/', '/grobogan-cradnu/memfs/');
      } else if (streamUrl.startsWith('https://stream.dishub.grobogan.go.id/memfs/')) {
        streamUrl = streamUrl.replace('https://stream.dishub.grobogan.go.id/memfs/', '/grobogan-stream/memfs/');
      } else if (streamUrl.startsWith('https://cctv.kotawaringinbaratkab.go.id/storage/')) {
        streamUrl = streamUrl.replace('https://cctv.kotawaringinbaratkab.go.id/storage/', '/kobar-stream/storage/');
      } else if (streamUrl.startsWith('https://cctv.malangkota.go.id/')) {
        streamUrl = streamUrl.replace('https://cctv.malangkota.go.id/', '/malang-stream/');
      } else if (streamUrl.startsWith('https://cctv.cirebonkota.go.id/')) {
        streamUrl = streamUrl.replace('https://cctv.cirebonkota.go.id/', '/cirebon-stream/');
      } else if (streamUrl.startsWith('https://cctv.purwakartakab.go.id/')) {
        streamUrl = streamUrl.replace('https://cctv.purwakartakab.go.id/', '/purwakarta-stream/');
      } else if (streamUrl.startsWith('https://cctv.tubankab.go.id/')) {
        streamUrl = streamUrl.replace('https://cctv.tubankab.go.id/', '/tuban-stream/');
      } else if (streamUrl.startsWith('https://stream.palembang.go.id/')) {
        streamUrl = streamUrl.replace('https://stream.palembang.go.id/', '/palembang-stream/');
      } else if (streamUrl.startsWith('https://shinobi.bulelengkab.go.id/')) {
        streamUrl = streamUrl.replace('https://shinobi.bulelengkab.go.id/', '/buleleng-stream/');
      } else if (streamUrl.startsWith('http://36.66.208.101:5000/')) {
        streamUrl = streamUrl.replace('http://36.66.208.101:5000/', '/surabaya-api/');
      }

      if (isFlv) {
        if (flvjs.isSupported()) {
          try {
            flvPlayer = flvjs.createPlayer({
              type: 'flv',
              url: streamUrl,
              isLive: true,
              hasAudio: false
            }, {
              enableStashBuffer: false
            });
            flvPlayer.attachMediaElement(video);
            flvPlayer.load();
            
            flvPlayer.on(flvjs.Events.ERROR, () => {
              if (active) {
                setHasError(true);
                setIsLoaded(false);
              }
            });

            const handleCanPlay = () => {
              if (active) video.play().catch(() => {});
            };
            video.addEventListener('canplay', handleCanPlay);
            cleanups.push(() => video.removeEventListener('canplay', handleCanPlay));
          } catch {
            setHasError(true);
          }
        } else {
          setHasError(true);
        }
      } else if (isMp4) {
        video.src = streamUrl;
        const handleCanPlay = () => {
          if (active) video.play().catch(() => {});
        };
        const handleError = () => {
          if (active) setHasError(true);
        };
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        cleanups.push(() => {
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleError);
        });
      } else {
        // HLS Player
        if (Hls.isSupported()) {
          const isShortWindow = streamUrl.includes('bwi-hls') || streamUrl.includes('surabaya-api');
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: isShortWindow ? 3 : 15,
            liveSyncDurationCount: 2,
            liveMaxLatencyDurationCount: 5
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (active) video.play().catch(() => {});
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (!active) return;
            if (data.fatal) {
              if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                hls?.startLoad();
              } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                hls?.recoverMediaError();
              } else {
                setHasError(true);
                hls?.destroy();
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          const handleLoadedMetadata = () => {
            if (active) video.play().catch(() => {});
          };
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          cleanups.push(() => video.removeEventListener('loadedmetadata', handleLoadedMetadata));
        } else {
          setHasError(true);
        }
      }
    };

    initPlayer();

    return () => {
      active = false;
      cleanups.forEach((cleanup) => cleanup());
      if (hls) hls.destroy();
      if (flvPlayer) {
        try {
          flvPlayer.unload();
          flvPlayer.detachMediaElement();
          flvPlayer.destroy();
        } catch { /* ignore flv cleanup errors */ }
      }
      if (video) video.src = '';
    };
  }, [cctv, isFlv, isIframe, isInitiallyOffline, isJsmpeg, isMjpeg, isMp4, isPurwakarta]);

  const toggleMute = () => {
    if (isMjpeg || isIframe || isJsmpeg) return;
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="multiview-cell-player">
      <div className="cell-header">
        <span className="cell-title">{cctv.name}</span>
        <div className="cell-actions">
          {!isMjpeg && !isIframe && !isJsmpeg && (
            <button className="cell-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
          )}
          <button className="cell-btn remove-btn" onClick={onClear} title="Hapus dari slot">
            <X size={12} />
          </button>
        </div>
      </div>
      
      <div className="cell-content">
        {!isLoaded && !hasError && (
          <div className="cell-status">
            <div className="cell-spinner"></div>
            <span>Memuat...</span>
          </div>
        )}
        {hasError && (
          <div className="cell-status error">
            <AlertTriangle size={20} className="text-red" />
            <span>⚠ Offline</span>
          </div>
        )}

        {isIframe && !hasError ? (
          <iframe
            src={isYoutube ? `${cctv.streamUrl}?autoplay=1&mute=1` : cctv.streamUrl}
            title={cctv.name}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            style={{ width: '100%', height: '100%', border: 'none', display: isLoaded ? 'block' : 'none' }}
            onLoad={() => setIsLoaded(true)}
          />
        ) : isMjpeg ? (
          <img
            src={cctv.streamUrl}
            alt={cctv.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: isLoaded ? 'block' : 'none' }}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
          />
        ) : isJsmpeg ? (
          <div
            ref={jsmpegCanvasRef}
            style={{ width: '100%', height: '100%', background: '#000' }}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
    </div>
  );
};

// Main dashboard
interface MultiViewDashboardProps {
  cctvs: CCTV[];
  favorites: string[];
  onBackToMap: () => void;
}

export const MultiViewDashboard: React.FC<MultiViewDashboardProps> = ({
  cctvs,
  favorites,
  onBackToMap
}) => {
  const [gridSize, setGridSize] = useState<2 | 3 | 4>(2); // 2x2, 3x3, 4x4
  const [slotAssignments, setSlotAssignments] = useState<Record<number, string>>({});

  const favoritedCCTVs = useMemo(() => {
    return cctvs.filter(c => favorites.includes(c.id));
  }, [cctvs, favorites]);

  // Auto-populate empty slots with unassigned favorites
  useEffect(() => {
    setSlotAssignments(prev => {
      const newAssignments = { ...prev };
      const assignedIds = Object.values(newAssignments);
      const unassignedFavs = favorites.filter(id => !assignedIds.includes(id));

      let unassignedIndex = 0;
      const totalSlots = gridSize * gridSize;

      for (let i = 0; i < totalSlots; i++) {
        // Re-assign if slot is empty or the assigned ID is no longer in favorites
        if (!newAssignments[i] || !favorites.includes(newAssignments[i])) {
          if (unassignedFavs[unassignedIndex]) {
            newAssignments[i] = unassignedFavs[unassignedIndex];
            unassignedIndex++;
          } else {
            delete newAssignments[i];
          }
        }
      }

      // Clean up slots that exceed the current grid size bounds
      for (let i = totalSlots; i < 16; i++) {
        delete newAssignments[i];
      }

      return newAssignments;
    });
  }, [favorites, gridSize]);

  const handleAssignCamera = (slotIndex: number, cctvId: string) => {
    setSlotAssignments(prev => ({
      ...prev,
      [slotIndex]: cctvId
    }));
  };

  const handleClearSlot = (slotIndex: number) => {
    setSlotAssignments(prev => {
      const updated = { ...prev };
      delete updated[slotIndex];
      return updated;
    });
  };

  const totalSlots = gridSize * gridSize;

  return (
    <div className="multiview-dashboard">
      <div className="multiview-header">
        <div className="header-left">
          <div className="dashboard-title-row">
            <LayoutGrid className="dashboard-icon" size={20} />
            <h2>Multi-View Dashboard</h2>
          </div>
          <p className="dashboard-subtitle">Pantau kamera terfavorit secara bersamaan dalam bentuk grid</p>
        </div>

        <div className="header-right">
          <div className="grid-selector">
            <button className={`grid-btn ${gridSize === 2 ? 'active' : ''}`} onClick={() => setGridSize(2)}>2x2</button>
            <button className={`grid-btn ${gridSize === 3 ? 'active' : ''}`} onClick={() => setGridSize(3)}>3x3</button>
            <button className={`grid-btn ${gridSize === 4 ? 'active' : ''}`} onClick={() => setGridSize(4)}>4x4</button>
          </div>

          <button className="btn-secondary back-map-btn" onClick={onBackToMap}>
            <Map size={14} />
            <span>Kembali ke Peta</span>
          </button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="multiview-empty-dashboard">
          <Heart size={48} className="empty-heart-icon animate-pulse-slow" />
          <h3>Belum Ada Kamera Terfavorit</h3>
          <p>Tambahkan kamera CCTV ke daftar favorit Anda di peta untuk memantau beberapa stream sekaligus di sini.</p>
          <button className="btn-primary" onClick={onBackToMap}>
            Kembali ke Peta & Cari CCTV
          </button>
        </div>
      ) : (
        <div className={`multiview-grid grid-${gridSize}x${gridSize}`}>
          {Array.from({ length: totalSlots }).map((_, index) => {
            const assignedId = slotAssignments[index];
            const assignedCCTV = assignedId ? favoritedCCTVs.find(c => c.id === assignedId) : null;

            return (
              <div key={index} className="multiview-grid-cell">
                {assignedCCTV ? (
                  <MultiVideoCellPlayer 
                    cctv={assignedCCTV} 
                    onClear={() => handleClearSlot(index)} 
                  />
                ) : (
                  <div className="empty-cell-placeholder">
                    <Heart size={20} className="empty-cell-icon" />
                    <span className="empty-cell-text">Slot {index + 1} Kosong</span>
                    
                    <select
                      className="empty-cell-select"
                      onChange={(e) => e.target.value && handleAssignCamera(index, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Pilih CCTV Favorit...</option>
                      {favoritedCCTVs
                        .filter(c => !Object.values(slotAssignments).includes(c.id))
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.city})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .multiview-dashboard {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          padding: 16px;
          gap: 16px;
          overflow: hidden;
          background: var(--bg-primary);
          font-family: var(--font-body);
        }

        .multiview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }

        .dashboard-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dashboard-icon {
          color: var(--accent-blue);
        }

        .multiview-header h2 {
          font-size: 1.25rem;
          color: var(--text-primary);
          margin: 0;
        }

        .dashboard-subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .grid-selector {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 3px;
        }

        .grid-btn {
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.8rem;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .grid-btn:hover {
          color: var(--text-primary);
        }

        .grid-btn.active {
          background: var(--accent-blue);
          color: #fff;
          box-shadow: 0 2px 8px var(--accent-blue-glow);
        }

        .back-map-btn {
          font-size: 0.8rem;
          font-weight: 500;
          padding: 8px 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .multiview-empty-dashboard {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 16px;
          background: rgba(15, 22, 38, 0.4);
          border: 1px dashed var(--border-color);
          border-radius: var(--radius-md);
          padding: 32px;
        }

        .empty-heart-icon {
          color: #ef4444;
          opacity: 0.8;
        }

        .multiview-empty-dashboard h3 {
          font-size: 1.15rem;
          color: var(--text-primary);
          margin: 0;
        }

        .multiview-empty-dashboard p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 420px;
          line-height: 1.5;
        }

        /* Responsive Grid layouts */
        .multiview-grid {
          flex: 1;
          display: grid;
          gap: 12px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .multiview-grid.grid-2x2 {
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
        }

        .multiview-grid.grid-3x3 {
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(3, 1fr);
        }

        .multiview-grid.grid-4x4 {
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(4, 1fr);
        }

        @media (max-width: 768px) {
          .multiview-grid.grid-3x3,
          .multiview-grid.grid-4x4 {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: auto;
          }
          .header-right {
            flex-direction: column;
            align-items: flex-end;
          }
        }

        @media (max-width: 480px) {
          .multiview-grid.grid-2x2,
          .multiview-grid.grid-3x3,
          .multiview-grid.grid-4x4 {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }
        }

        .multiview-grid-cell {
          background: rgba(15, 22, 38, 0.6);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          aspect-ratio: 16 / 9;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s ease;
        }

        .multiview-grid-cell:hover {
          border-color: var(--border-color-active);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
        }

        /* Empty slot styles */
        .empty-cell-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px;
          gap: 12px;
          text-align: center;
          border: 2px dashed rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-md);
        }

        .empty-cell-icon {
          color: var(--text-muted);
        }

        .empty-cell-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .empty-cell-select {
          background: rgba(8, 12, 20, 0.8);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 0.75rem;
          outline: none;
          max-width: 180px;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }

        .empty-cell-select:focus {
          border-color: var(--accent-blue);
        }

        /* Cell Player styles */
        .multiview-cell-player {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .cell-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          background: rgba(0, 0, 0, 0.4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          z-index: 10;
        }

        .cell-title {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: calc(100% - 60px);
        }

        .cell-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cell-btn {
          border: none;
          background: transparent;
          color: var(--text-secondary);
          width: 22px;
          height: 22px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .cell-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.06);
        }

        .cell-btn.remove-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .cell-content {
          flex: 1;
          position: relative;
          background: #000;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cell-status {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #000;
          color: var(--text-secondary);
          font-size: 0.7rem;
          z-index: 2;
        }

        .cell-status.error {
          color: #ef4444;
        }

        .cell-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.05);
          border-top-color: var(--accent-blue);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .text-red {
          color: #ef4444;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
