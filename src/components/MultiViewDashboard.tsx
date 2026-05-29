import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import flvjs from 'flv.js';
import JSMpeg from '@cycjimmy/jsmpeg-player';
import { type CCTV } from '../data/cctvData';
import { Heart, Map, Volume2, VolumeX, X, AlertTriangle, Play, Pause, Camera, Maximize } from 'lucide-react';

const isMobileDevice = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// Lightweight player component for a single grid slot
interface MultiVideoCellPlayerProps {
  cctv: CCTV;
  onClear: () => void;
}

const MultiVideoCellPlayer: React.FC<MultiVideoCellPlayerProps> = ({ cctv, onClear }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const jsmpegCanvasRef = useRef<HTMLDivElement>(null);
  const cellContainerRef = useRef<HTMLDivElement>(null);
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);

  const viewportContainerRef = useRef<HTMLDivElement>(null);
  const togglePlayRef = useRef<() => void>(() => {});
  
  const zoomScaleRef = useRef(1);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const isRotatedRef = useRef(false);
  const touchStateRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    initialPan: { x: 0, y: 0 },
    initialCenter: { x: 0, y: 0 },
    isPinching: false,
    isPanning: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwipe: false,
    gestureOccurred: false
  });

  // Sync refs with state changes
  useEffect(() => {
    zoomScaleRef.current = zoomScale;
  }, [zoomScale]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  useEffect(() => {
    isRotatedRef.current = isRotated;
  }, [isRotated]);

  // Reset rotation, zoom and pan when CCTV changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on prop change, batched by React
    setIsRotated(false);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [cctv.id]);

  // Reset zoom and pan when fullscreen or orientation changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset, batched by React
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [isFullscreen, isRotated]);

  // Keep panOffset clamped within the allowed bounds whenever scale changes
  useEffect(() => {
    const el = viewportContainerRef.current;
    if (!el) return;

    const width = el.clientWidth;
    const height = el.clientHeight;
    
    const maxPanX = (width * (zoomScale - 1)) / (2 * zoomScale);
    const maxPanY = (height * (zoomScale - 1)) / (2 * zoomScale);

    setPanOffset(prev => {
      const clampedX = Math.min(Math.max(prev.x, -maxPanX), maxPanX);
      const clampedY = Math.min(Math.max(prev.y, -maxPanY), maxPanY);
      
      if (clampedX !== prev.x || clampedY !== prev.y) {
        return { x: clampedX, y: clampedY };
      }
      return prev;
    });
  }, [zoomScale]);

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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- error handling in catch, not main effect body
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
      } else if (streamUrl.startsWith('https://dishub.depok.go.id/')) {
        streamUrl = streamUrl.replace('https://dishub.depok.go.id/', '/depok-stream/');
      } else if (streamUrl.startsWith('https://cctv-dishub.sukabumikab.go.id/')) {
        streamUrl = streamUrl.replace('https://cctv-dishub.sukabumikab.go.id/', '/sukabumikab-stream/');
      } else if (streamUrl.startsWith('https://cctv.pekalongankab.go.id/')) {
        streamUrl = streamUrl.replace('https://cctv.pekalongankab.go.id/', '/pekalongankab-stream/');
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
            capLevelToPlayerSize: false,
            startFragPrefetch: true,
            backBufferLength: 10,
            maxBufferLength: isShortWindow ? 3 : 10,
            maxMaxBufferLength: isShortWindow ? 5 : 20,
            maxBufferHole: 0.5,
            maxStarvationDelay: 1,
            liveSyncDurationCount: isShortWindow ? 1 : 2,
            liveMaxLatencyDurationCount: isShortWindow ? 2 : 4
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          // Play as early as possible — on first buffered fragment
          let hasStartedPlay = false;
          const startPlay = () => {
            if (hasStartedPlay || !active) return;
            hasStartedPlay = true;
            setIsLoaded(true);
            video.play().catch(() => {});
          };

          hls.on(Hls.Events.FRAG_BUFFERED, startPlay);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (hls && hls.levels && hls.levels.length > 0) {
              const highestLevel = hls.levels.length - 1;
              hls.startLevel = highestLevel;
              hls.currentLevel = highestLevel;
              hls.loadLevel = highestLevel;
            }
            startPlay();
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

  // Play/Pause
  const togglePlay = useCallback(() => {
    if (isMjpeg || isIframe || isJsmpeg) return;
    const video = videoRef.current;
    if (!video || !isLoaded) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => { /* autoplay blocked */ });
      setIsPlaying(true);
    }
  }, [isMjpeg, isIframe, isJsmpeg, isLoaded, isPlaying]);

  useEffect(() => {
    togglePlayRef.current = togglePlay;
  }, [togglePlay]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (isMjpeg || isIframe || isJsmpeg) return;
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = 0.5;
      setVolume(0.5);
      setIsMuted(false);
    } else {
      video.muted = true;
      setVolume(0);
      setIsMuted(true);
    }
  }, [isMjpeg, isIframe, isJsmpeg, isMuted]);

  // Volume slider
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMjpeg || isIframe || isJsmpeg) return;
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      video.muted = true;
      setIsMuted(true);
    } else {
      video.muted = false;
      setIsMuted(false);
    }
  }, [isMjpeg, isIframe, isJsmpeg]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = cellContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { /* fullscreen denied */ });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls || !isPlaying) return;
    const timer = setTimeout(() => setShowControls(false), 2500);
    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  // Back button handling on mobile when rotated
  useEffect(() => {
    if (!isRotated) return;

    window.history.pushState({ cellRotated: true }, '');

    const handlePopState = () => {
      setIsRotated(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state && window.history.state.cellRotated) {
        window.history.back();
      }
    };
  }, [isRotated]);

  // Touch gestures for pinch-to-zoom and pan/drag in cell player
  useEffect(() => {
    const el = viewportContainerRef.current;
    if (!el) return;

    const state = touchStateRef.current;

    const onTouchStart = (e: TouchEvent) => {
      const currentScale = zoomScaleRef.current;
      const currentPan = panOffsetRef.current;

      state.gestureOccurred = false;

      if (e.touches.length === 1) {
        setIsTouching(true);
        state.startX = e.touches[0].clientX;
        state.startY = e.touches[0].clientY;
        state.currentX = e.touches[0].clientX;
        state.currentY = e.touches[0].clientY;

        if (currentScale > 1) {
          state.isPanning = true;
          state.isPinching = false;
          state.isSwipe = false;
          state.initialCenter = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
          state.initialPan = { ...currentPan };
        } else {
          state.isPanning = false;
          state.isPinching = false;
          state.isSwipe = true;
        }
      } else if (e.touches.length === 2) {
        setIsTouching(true);
        state.isPinching = true;
        state.isPanning = false;
        state.isSwipe = false;
        state.gestureOccurred = true;
        
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        state.initialDistance = dist;
        state.initialScale = currentScale;
        state.initialPan = { ...currentPan };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const currentScale = zoomScaleRef.current;

      if (state.isPinching && e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        state.gestureOccurred = true;
        
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const initialDist = state.initialDistance;
        if (initialDist > 0) {
          const factor = dist / initialDist;
          const newScale = Math.min(Math.max(state.initialScale * factor, 1), 4);
          setZoomScale(newScale);
          
          if (newScale === 1) {
            setPanOffset({ x: 0, y: 0 });
          }
        }
      } else if (state.isPanning && e.touches.length === 1 && currentScale > 1) {
        if (e.cancelable) e.preventDefault();
        state.gestureOccurred = true;
        
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;

        state.currentX = clientX;
        state.currentY = clientY;
        
        const dx = clientX - state.initialCenter.x;
        const dy = clientY - state.initialCenter.y;
        
        const width = el.clientWidth;
        const height = el.clientHeight;

        const maxPanX = (width * (currentScale - 1)) / (2 * currentScale);
        const maxPanY = (height * (currentScale - 1)) / (2 * currentScale);
        
        let targetX: number;
        let targetY: number;

        if (isRotatedRef.current) {
          // Rotated 90deg: screen X (dx) maps to local Y (inverted), screen Y (dy) maps to local X
          targetX = state.initialPan.x + dy / currentScale;
          targetY = state.initialPan.y - dx / currentScale;
        } else {
          // Portrait: standard mapping
          targetX = state.initialPan.x + dx / currentScale;
          targetY = state.initialPan.y + dy / currentScale;
        }
        
        const boundedX = Math.min(Math.max(targetX, -maxPanX), maxPanX);
        const boundedY = Math.min(Math.max(targetY, -maxPanY), maxPanY);

        setPanOffset({
          x: boundedX,
          y: boundedY
        });
      } else if (state.isSwipe && e.touches.length === 1 && currentScale === 1) {
        const clientY = e.touches[0].clientY;
        const dy = clientY - state.startY;
        if (Math.abs(dy) > 10) {
          if (e.cancelable) e.preventDefault();
          state.gestureOccurred = true;
        }
        state.currentX = e.touches[0].clientX;
        state.currentY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      setIsTouching(false);
      const currentScale = zoomScaleRef.current;
      
      const dx = state.currentX - state.startX;
      const dy = state.currentY - state.startY;
      
      if (!state.gestureOccurred && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        if (e.cancelable) {
          e.preventDefault();
        }
        // Universal Tap: play/pause on tap at any scale (both zoomed and normal)
        togglePlayRef.current();
      } else if (state.isSwipe && currentScale === 1) {
        // If it's a significant vertical swipe
        if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
          if (dy < 0) {
            setIsRotated(true);
          } else {
            setIsRotated(false);
          }
        }
      }

      state.isPinching = false;
      state.isPanning = false;
      state.isSwipe = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Take snapshot
  const takeSnapshot = useCallback(() => {
    if (isMjpeg) {
      const img = cellContainerRef.current?.querySelector('img');
      if (!img || !isLoaded) return;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawWatermark(ctx, canvas, cctv.name);
      downloadCanvas(canvas, cctv.name);
      return;
    }
    if (isJsmpeg) {
      const sourceCanvas = jsmpegCanvasRef.current?.querySelector('canvas');
      if (!sourceCanvas || !isLoaded) return;
      const canvas = document.createElement('canvas');
      canvas.width = sourceCanvas.width || 640;
      canvas.height = sourceCanvas.height || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
      drawWatermark(ctx, canvas, cctv.name);
      downloadCanvas(canvas, cctv.name);
      return;
    }
    const video = videoRef.current;
    if (!video || !isLoaded) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawWatermark(ctx, canvas, cctv.name);
    downloadCanvas(canvas, cctv.name);
  }, [isMjpeg, isJsmpeg, isLoaded, cctv.name]);

  return (
    <div
      className={`multiview-cell-player ${isFullscreen ? 'cell-fullscreen' : ''} ${isRotated ? 'cell-rotated-landscape' : ''}`}
      ref={cellContainerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onMouseMove={() => setShowControls(true)}
    >
      {isRotated && !isMobileDevice && (
        <div className="cell-rotated-top-bar">
          <span className="cell-rotated-title">{cctv.name}</span>
          <button className="cell-rotated-close-btn" onClick={() => setIsRotated(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      {!isRotated && (
        <div className="cell-header">
          <span className="cell-title">{cctv.name}</span>
          <button className="cell-btn remove-btn" onClick={onClear} title="Hapus dari slot">
            <X size={12} />
          </button>
        </div>
      )}
      
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

        <div 
          className="cell-video-viewport"
          ref={viewportContainerRef}
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoomScale}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: 'center center',
            transition: isTouching ? 'none' : 'transform 0.15s ease-out'
          }}
        >
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
              preload="auto"
              muted={isMuted}
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onClick={() => {
                if (!isMobileDevice) {
                  togglePlay();
                }
              }}
            />
          )}
        </div>

        {isMobileDevice && isLoaded && !hasError && !isPlaying && (
          <div className="mobile-play-overlay" onClick={togglePlay}>
            <div className="mobile-play-btn">
              <Play size={24} fill="currentColor" />
            </div>
          </div>
        )}

        {/* HUD Controls overlay */}
        {isLoaded && !hasError && !isMobileDevice && (
          <div className={`cell-hud ${showControls || !isPlaying ? 'active' : ''}`}>
            <div className="cell-hud-bar">
              <div className="cell-hud-left">
                {!isMjpeg && !isIframe && !isJsmpeg && (
                  <button className="cell-hud-btn" onClick={togglePlay} title={isPlaying ? 'Jeda' : 'Putar'}>
                    {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                  </button>
                )}
                {!isMjpeg && !isIframe && !isJsmpeg && (
                  <div className="cell-volume-wrapper">
                    <button className="cell-hud-btn" onClick={toggleMute} title={isMuted ? 'Bunyikan' : 'Bisukan'}>
                      {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="cell-volume-slider"
                      title="Volume"
                    />
                  </div>
                )}
              </div>
              <div className="cell-hud-right">
                {!isIframe && (
                  <button className="cell-hud-btn" onClick={takeSnapshot} title="Ambil Foto">
                    <Camera size={12} />
                  </button>
                )}
                <button className="cell-hud-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}>
                  <Maximize size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Snapshot watermark helpers
function drawWatermark(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, name: string) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 16px Outfit, sans-serif';
  ctx.fillText('NUSANTARA CCTV', 16, canvas.height - 18);
  const now = new Date();
  const formattedTime = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString('id-ID');
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText(`|  ${name.toUpperCase()}  |  ${formattedTime}`, 180, canvas.height - 18);
}

function downloadCanvas(canvas: HTMLCanvasElement, name: string) {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `CCTV_${name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    link.href = dataUrl;
    link.click();
  } catch {
    /* CORS restriction on stream source */
    alert('Gagal mengambil screenshot: batasan keamanan CORS pada server stream.');
  }
}

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
  const [gridSize, setGridSize] = useState<1 | 2 | 3 | 4>(2); // 1x1, 2x2, 3x3, 4x4
  const [slotAssignments, setSlotAssignments] = useState<Record<number, string>>({});

  const favoritedCCTVs = useMemo(() => {
    return cctvs.filter(c => favorites.includes(c.id));
  }, [cctvs, favorites]);

  // Auto-populate empty slots with unassigned favorites
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional slot population on prop change
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
        <div className="grid-selector">
          <button className={`grid-btn ${gridSize === 1 ? 'active' : ''}`} onClick={() => setGridSize(1)}>1x1</button>
          <button className={`grid-btn ${gridSize === 2 ? 'active' : ''}`} onClick={() => setGridSize(2)}>2x2</button>
          <button className={`grid-btn ${gridSize === 3 ? 'active' : ''}`} onClick={() => setGridSize(3)}>3x3</button>
          <button className={`grid-btn ${gridSize === 4 ? 'active' : ''}`} onClick={() => setGridSize(4)}>4x4</button>
        </div>

        <button className="btn-secondary back-map-btn" onClick={onBackToMap}>
          <Map size={14} />
          <span>Kembali ke Peta</span>
        </button>
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
          padding: 12px;
          gap: 12px;
          overflow: hidden;
          background: var(--bg-primary);
          font-family: var(--font-body);
        }

        .multiview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
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
          gap: 8px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .multiview-grid.grid-1x1 {
          grid-template-columns: repeat(1, 1fr);
          grid-template-rows: repeat(1, 1fr);
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

        .multiview-cell-player.cell-fullscreen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          border-radius: 0;
          background: #000;
        }

        .multiview-cell-player.cell-rotated-landscape {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          width: 100vh !important;
          height: 100vw !important;
          max-width: 100vh !important;
          max-height: 100vw !important;
          transform: translate(-50%, -50%) rotate(90deg) !important;
          transform-origin: center center !important;
          z-index: 99999 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          background: #000000 !important;
        }

        .multiview-cell-player.cell-rotated-landscape .cell-content {
          width: 100% !important;
          height: 100% !important;
          flex: 1 !important;
          aspect-ratio: auto !important;
        }

        .multiview-cell-player.cell-rotated-landscape video,
        .multiview-cell-player.cell-rotated-landscape canvas,
        .multiview-cell-player.cell-rotated-landscape img {
          object-fit: fill !important;
          width: 100% !important;
          height: 100% !important;
        }

        .cell-video-viewport {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: none;
        }

        .cell-video-viewport video,
        .cell-video-viewport canvas,
        .cell-video-viewport img {
          image-rendering: -webkit-optimize-contrast !important;
          image-rendering: crisp-edges !important;
          image-rendering: pixelated !important;
        }

        .cell-rotated-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: rgba(0, 0, 0, 0.6);
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
        }

        .cell-rotated-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cell-rotated-close-btn {
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(0, 0, 0, 0.4);
          color: #fff;
          width: 28px;
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .mobile-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.35);
          z-index: 10;
          cursor: pointer;
        }

        .mobile-play-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .mobile-play-btn svg {
          margin-left: 3px;
        }

        .cell-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 10px;
          background: rgba(0, 0, 0, 0.5);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          z-index: 10;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
        }

        .cell-title {
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: calc(100% - 30px);
          text-shadow: 0 1px 3px rgba(0,0,0,0.6);
        }

        .cell-btn {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
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
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
        }

        .cell-btn.remove-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
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

        /* HUD Controls */
        .cell-hud {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translate(-50%, 6px);
          width: max-content;
          z-index: 15;
          opacity: 0;
          transition: opacity 0.2s ease, transform 0.2s ease;
          pointer-events: none;
        }

        .cell-hud.active {
          opacity: 1;
          transform: translate(-50%, 0);
          pointer-events: auto;
        }

        .cell-hud-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          background: rgba(15, 22, 38, 0.3) !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 8px;
          width: 100%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
          gap: 16px;
        }

        .cell-hud-left,
        .cell-hud-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cell-hud-btn {
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.85);
          width: 26px;
          height: 26px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
        }

        .cell-hud-btn:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.12);
        }

        .cell-volume-wrapper {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .cell-volume-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 50px;
          height: 3px;
          background: rgba(255, 255, 255, 0.25);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          transition: width 0.2s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
        }

        .cell-volume-wrapper:hover .cell-volume-slider {
          width: 65px;
        }

        .cell-volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
        }

        .cell-volume-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
