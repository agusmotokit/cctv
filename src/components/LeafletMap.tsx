/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, react-hooks/set-state-in-effect */
import React, { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, ZoomControl } from 'react-leaflet';
import * as L from 'leaflet';
import Hls, { XhrLoader } from 'hls.js';
import { type User } from 'firebase/auth';

class PlaylistLoader extends XhrLoader {
  load(context: any, config: any, callbacks: any) {
    const originalOnSuccess = callbacks.onSuccess;
    callbacks.onSuccess = function(response: any, stats: any, ctx: any, networkDetails: any) {
      if (typeof response.data === 'string' && ctx.url.includes('bandarlampung-stream')) {
        let playlistText = response.data;
        playlistText = playlistText.replace(/https:\/\/sliceseribuwajah\.bandarlampungkota\.go\.id\//g, '/bandarlampung-stream/');
        playlistText = playlistText.replace(/\/resource\//g, '/bandarlampung-stream/resource/');
        response.data = playlistText;
      }
      originalOnSuccess(response, stats, ctx, networkDetails);
    };

    if (context.url.includes('.m3u8') || context.url.includes('bandarlampung-stream')) {
      const isBanyuwangi =
        context.url.includes('bwi-hls') ||
        context.url.includes('live.banyuwangikab.go.id');

      if (isBanyuwangi) {
        // Extract raw stream ID from URL path, e.g. /bwi-hls/37/index.m3u8 → "37"
        const match = context.url.match(/\/(?:bwi-hls|hls)\/(\d+)\//);
        const rawId = match ? match[1] : '0';
        const epochSec = Math.floor(Date.now() / 1000);
        // Strip any existing t= or _ts= params to avoid accumulation
        let cleanUrl = context.url
          .replace(/[?&]t=[^&]+/, '')
          .replace(/[?&]_ts=[^&]+/, '');
        const sep = cleanUrl.includes('?') ? '&' : '?';
        // Use the server's native cache-bypass format: ?t=<rawId>-<epochSeconds>
        context.url = `${cleanUrl}${sep}t=${rawId}-${epochSec}`;
      } else {
        // For all other cities, use a standard _ts param cache buster
        let cleanUrl = context.url.replace(/[?&]_ts=[^&]+/, '');
        const sep = cleanUrl.includes('?') ? '&' : '?';
        context.url = `${cleanUrl}${sep}_ts=${Date.now()}`;
      }
    }
    super.load(context, config, callbacks);
  }
}
import flvjs from 'flv.js';
import JSMpeg from '@cycjimmy/jsmpeg-player';
import type { CCTV } from '../data/cctvData';
import { Play, Pause, Volume2, VolumeX, Maximize, Camera, MapPin, Tag, X, Radio, Heart, RotateCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const isMobileDevice = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

// Create CCTV camera pin marker icon (SVG-based)
const createCCTVMarker = (status: 'online' | 'offline', showAnimation = true) => {
  const isOnline = status === 'online';
  const pinColor = isOnline ? '#3b82f6' : '#ef4444';
  const pinColorDark = isOnline ? '#2563eb' : '#dc2626';

  return L.divIcon({
    html: `
      <div class="cctv-pin-marker">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Pin shape -->
          <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 14.2 24.5 15.3 25.6a1 1 0 001.4 0C17.8 40.5 32 26.5 32 16 32 7.163 24.837 0 16 0z" fill="${pinColor}" stroke="${pinColorDark}" stroke-width="1"/>
          <!-- White circle bg -->
          <circle cx="16" cy="15" r="10" fill="white" opacity="0.95"/>
          <!-- Camera icon -->
          <g transform="translate(8.5, 8)" fill="${pinColor}">
            <rect x="1" y="3" width="9" height="7" rx="1.2" fill="${pinColor}"/>
            <polygon points="10,4.5 14,2.5 14,10.5 10,8.5" fill="${pinColor}"/>
            <circle cx="5.5" cy="6.5" r="2" fill="white" opacity="0.7"/>
          </g>
        </svg>
        ${isOnline && showAnimation ? '<div class="cctv-pin-pulse"></div>' : ''}
      </div>
    `,
    className: 'custom-cctv-marker',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  });
};

// Pre-created static marker icon instances to prevent recreating icons on every single render cycle.
const ONLINE_ICON = createCCTVMarker('online', true);
const OFFLINE_ICON = createCCTVMarker('offline', true);
const ONLINE_ICON_NO_ANIM = createCCTVMarker('online', false);
const OFFLINE_ICON_NO_ANIM = createCCTVMarker('offline', false);

const createCCTVDotMarker = (status: 'online' | 'offline', showAnimation = true) => {
  const isOnline = status === 'online';
  const dotColor = isOnline ? '#3b82f6' : '#ef4444';
  const pulseClass = isOnline ? 'cctv-dot-pulse-online' : 'cctv-dot-pulse-offline';

  return L.divIcon({
    html: `
      <div class="cctv-dot-marker">
        <div class="cctv-dot-core" style="background-color: ${dotColor}"></div>
        ${showAnimation ? `<div class="cctv-dot-pulse ${pulseClass}" style="border-color: ${dotColor}"></div>` : ''}
      </div>
    `,
    className: 'custom-cctv-dot',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  });
};

const ONLINE_DOT_ICON = createCCTVDotMarker('online', true);
const OFFLINE_DOT_ICON = createCCTVDotMarker('offline', true);
const ONLINE_DOT_ICON_NO_ANIM = createCCTVDotMarker('online', false);
const OFFLINE_DOT_ICON_NO_ANIM = createCCTVDotMarker('offline', false);


interface MapControllerProps {
  lat: number;
  lng: number;
  zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ lat, lng, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    const container = map.getContainer();
    let ro: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        map.invalidateSize();
      });
      ro.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ro) ro.disconnect();
    };
  }, [map]);

  return null;
};

// Component to close popups when video starts playing
const PopupCloser: React.FC<{ watching: CCTV | null }> = ({ watching }) => {
  const map = useMap();
  useEffect(() => {
    if (watching) {
      map.closePopup();
    }
  }, [watching, map]);
  return null;
};

interface MapBoundsTrackerProps {
  onBoundsChange: (bounds: L.LatLngBounds) => void;
  onZoomChange: (zoom: number) => void;
}

const MapBoundsTracker: React.FC<MapBoundsTrackerProps> = ({ onBoundsChange, onZoomChange }) => {
  const map = useMap();

  useEffect(() => {
    onBoundsChange(map.getBounds());
    onZoomChange(map.getZoom());

    const handleMapChange = () => {
      onBoundsChange(map.getBounds());
      onZoomChange(map.getZoom());
    };

    map.on('moveend', handleMapChange);
    map.on('zoomend', handleMapChange);

    return () => {
      map.off('moveend', handleMapChange);
      map.off('zoomend', handleMapChange);
    };
  }, [map, onBoundsChange, onZoomChange]);

  return null;
};

// Inline HLS Video Player for Map overlay
interface MapVideoPlayerProps {
  cctv: CCTV;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const MapVideoPlayer: React.FC<MapVideoPlayerProps> = ({
  cctv,
  onClose,
  isFavorite,
  onToggleFavorite
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const jsmpegCanvasRef = useRef<HTMLDivElement>(null);
  const jsmpegPlayerRef = useRef<any>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0); // Muted by default
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotated, setIsRotated] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);

  const viewportContainerRef = useRef<HTMLDivElement>(null);
  
  const zoomScaleRef = useRef(1);
  const panOffsetRef = useRef({ x: 0, y: 0 });
  const touchStateRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    initialPan: { x: 0, y: 0 },
    initialCenter: { x: 0, y: 0 },
    isPinching: false,
    isPanning: false
  });

  // Sync refs with state changes
  useEffect(() => {
    zoomScaleRef.current = zoomScale;
  }, [zoomScale]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  const isRotatedRef = useRef(false);
  useEffect(() => {
    isRotatedRef.current = isRotated;
  }, [isRotated]);

  // Reset rotation, zoom and pan when CCTV changes
  useEffect(() => {
    setIsRotated(false);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [cctv.id]);

  // Reset zoom and pan when fullscreen or orientation changes
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [isFullscreen, isRotated]);

  // Touch gestures for pinch-to-zoom and pan/drag
  useEffect(() => {
    const el = viewportContainerRef.current;
    if (!el) return;

    const state = touchStateRef.current;

    const onTouchStart = (e: TouchEvent) => {
      const currentScale = zoomScaleRef.current;
      const currentPan = panOffsetRef.current;

      if (e.touches.length === 1) {
        if (currentScale > 1) {
          setIsTouching(true);
          state.isPanning = true;
          state.isPinching = false;
          state.initialCenter = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          };
          state.initialPan = { ...currentPan };
        }
      } else if (e.touches.length === 2) {
        setIsTouching(true);
        state.isPinching = true;
        state.isPanning = false;
        
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
        
        const clientX = e.touches[0].clientX;
        const clientY = e.touches[0].clientY;
        
        const dx = clientX - state.initialCenter.x;
        const dy = clientY - state.initialCenter.y;
        
        const rect = el.getBoundingClientRect();
        const elementWidth = isRotatedRef.current ? rect.height : rect.width;
        const elementHeight = isRotatedRef.current ? rect.width : rect.height;

        const maxPanX = (elementWidth * (currentScale - 1)) / (2 * currentScale);
        const maxPanY = (elementHeight * (currentScale - 1)) / (2 * currentScale);
        
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
      }
    };

    const onTouchEnd = () => {
      setIsTouching(false);
      state.isPinching = false;
      state.isPanning = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const isMjpeg = cctv.streamUrl.includes('nph-zms') || cctv.streamUrl.includes('cgi-bin/nph-zms') || cctv.streamUrl.includes('jombangkab.go.id');
  const isJsmpeg = cctv.streamUrl.includes('streamer-jsmpeg') || cctv.streamUrl.includes('villabs.id/streamer');
  const isFlv = !isJsmpeg && (cctv.streamUrl.startsWith('wss://') || cctv.streamUrl.startsWith('ws://') || cctv.streamUrl.endsWith('.flv'));
  const isYoutube = cctv.streamUrl.includes('youtube.com') || cctv.streamUrl.includes('youtu.be');
  const isIframe = isYoutube || cctv.streamUrl.includes('smartcctv.wonogirikab.go.id') || cctv.streamUrl.includes('.html');
  const isMp4 = cctv.streamUrl.includes('.mp4');
  const isPurwakarta = cctv.id.startsWith('purwakarta-');

  // Initialize Video Player (HLS or FLV)
  useEffect(() => {
    let active = true;
    const cleanups: (() => void)[] = [];

    if (cctv.status === 'offline' || (isIframe && (cctv.streamUrl === 'https://www.youtube.com/embed/' || cctv.streamUrl.endsWith('/embed/') || cctv.streamUrl === ''))) {
      setHasError(true);
      setIsLoaded(true);
      return;
    }

    if (isMjpeg) return;

    if (isIframe) {
      setHasError(false);
      setIsLoaded(false);
      return;
    }

    // JSMpeg WebSocket player (canvas-based, e.g. Madiun CCTV)
    if (isJsmpeg) {
      const wrapper = jsmpegCanvasRef.current;
      if (!wrapper) return;
      wrapper.innerHTML = '';

      try {
        const player = new (JSMpeg as any).VideoElement(
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
                  setIsPlaying(true);
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

        // Mark loaded after a short delay (JSMpeg hooks may not always fire)
        const loadTimeout = setTimeout(() => {
          if (active) {
            setIsLoaded(true);
            setIsPlaying(true);
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
        console.error('Failed to init JSMpeg player:', e);
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
      let reconnectTID: any = null;
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
        } catch {
          // Ignore error on resetting video sources
        }
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
                    try {
                      if (!sb.updating && sb.buffered && sb.buffered.length) {
                        const end = sb.buffered.end(sb.buffered.length - 1);
                        const start = sb.buffered.start(0);
                        const cleanStart = end - 2;
                        if (cleanStart > start && !sb.updating) {
                          sb.remove(start, cleanStart);
                          ms.setLiveSeekableRange(cleanStart, end);
                        }
                        const latency = end - video.currentTime;
                        if (latency > 4.0) {
                          video.currentTime = end - 1.0;
                        }
                        if (latency > 2.0) {
                          video.playbackRate = 1.15;
                        } else if (latency < 1.0) {
                          video.playbackRate = 1.0;
                        }
                      }
                    } catch {
                      // Ignore error during buffer latency check
                    }
                  });
                } catch (e: any) {
                  console.warn('[PurwakartaPlayer] addSourceBuffer:', e.message);
                }
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
                } catch (e) {
                  console.warn('[PurwakartaPlayer] direct append error:', e);
                }
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

          ws.onerror = (e) => {
            console.error('[PurwakartaPlayer] WS error:', e);
            if (active) {
              setHasError(true);
            }
          };
        }, { once: true });
      };

      connect();

      return () => {
        cleanup();
      };
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
      if (cctv.id.startsWith('gresik-')) {
        const rawId = cctv.id.replace('gresik-', '');
        fetch('/gresik-api/rpc/cctv/startStreamById', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer default-token'
          },
          body: JSON.stringify({ json: { id: rawId } })
        }).catch((e) => console.error('Failed to start Gresik stream:', e));
      }

      if (cctv.id.startsWith('surabaya-')) {
        const rawId = cctv.id.replace('surabaya-', '');
        fetch(`/surabaya-api/api/start_stream/${rawId}`, {
          method: 'POST'
        }).catch((e) => console.error('Failed to start Surabaya stream:', e));
      }

      if (!active) return;

      let streamUrl = cctv.streamUrl;
      if (cctv.id.startsWith('tuban-')) {
        const rawId = cctv.id.replace('tuban-', '');
        try {
          const res = await fetch(`/tuban-api/stream-token/${rawId}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.stream_url) {
              streamUrl = data.stream_url;
            }
          }
        } catch (e) {
          console.error('Failed to fetch Tuban stream token:', e);
        }
      }

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
            
            flvPlayer.on(flvjs.Events.ERROR, (errType: unknown, errDetail: unknown) => {
              console.error('FLV.js Error:', errType, errDetail);
              if (active) {
                setHasError(true);
                setIsLoaded(false);
              }
            });

            const handleCanPlay = () => {
              if (!active) return;
              video.play().catch((e) => {
                console.warn('Playback prevented:', e);
                setIsPlaying(false);
              });
            };
            video.addEventListener('canplay', handleCanPlay);
            cleanups.push(() => video.removeEventListener('canplay', handleCanPlay));

            const handleVisibilityChange = () => {
              if (document.visibilityState === 'visible' && video.buffered.length > 0) {
                const end = video.buffered.end(0);
                if (end - video.currentTime > 1.5) {
                  video.currentTime = end - 0.5;
                }
              }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            cleanups.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));

            const latencyInterval = setInterval(() => {
              if (active && !video.paused && video.buffered.length > 0) {
                const end = video.buffered.end(0);
                if (end - video.currentTime > 3.0) {
                  video.currentTime = end - 0.8;
                }
              }
            }, 3000);
            cleanups.push(() => clearInterval(latencyInterval));

          } catch (e) {
            console.error('Failed to initialize flv.js player:', e);
            setHasError(true);
          }
        } else {
          setHasError(true);
        }
      } else if (isMp4) {
        video.src = streamUrl;
        const handleCanPlay = () => {
          if (!active) return;
          video.play().catch((e) => {
            console.warn('Playback prevented:', e);
            setIsPlaying(false);
          });
        };
        const handleError = () => {
          if (!active) return;
          setHasError(true);
          setIsLoaded(false);
        };
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        cleanups.push(() => {
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleError);
        });
      } else {
        if (Hls.isSupported()) {
          const isShortWindowStream =
            streamUrl.includes('bwi-hls') ||
            streamUrl.includes('kuningan-stream') ||
            streamUrl.includes('bandarlampung-stream') ||
            streamUrl.includes('surabaya-api');
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: isShortWindowStream ? 4 : 30,
            maxMaxBufferLength: isShortWindowStream ? 6 : 45,
            maxStarvationDelay: 2.5,
            liveSyncDurationCount: isShortWindowStream ? 1.5 : 10,
            liveMaxLatencyDurationCount: isShortWindowStream ? 2.5 : 15,
            manifestLoadPolicy: {
              default: {
                maxTimeToFirstByteMs: 8000,
                maxLoadTimeMs: 20000,
                errorRetry: {
                  maxNumRetry: 15,
                  retryDelayMs: 800,
                  maxRetryDelayMs: 4000
                },
                timeoutRetry: {
                  maxNumRetry: 4,
                  retryDelayMs: 1000,
                  maxRetryDelayMs: 8000
                }
              }
            },
            playlistLoadPolicy: {
              default: {
                maxTimeToFirstByteMs: 8000,
                maxLoadTimeMs: 20000,
                errorRetry: {
                  maxNumRetry: 15,
                  retryDelayMs: 800,
                  maxRetryDelayMs: 4000
                },
                timeoutRetry: {
                  maxNumRetry: 4,
                  retryDelayMs: 1000,
                  maxRetryDelayMs: 8000
                }
              }
            },
            fragLoadPolicy: {
              default: {
                maxTimeToFirstByteMs: 8000,
                maxLoadTimeMs: 20000,
                errorRetry: {
                  maxNumRetry: 10,
                  retryDelayMs: 1000,
                  maxRetryDelayMs: 8000
                },
                timeoutRetry: {
                  maxNumRetry: 4,
                  retryDelayMs: 1000,
                  maxRetryDelayMs: 8000
                }
              }
            },
            pLoader: PlaylistLoader as any
          });

          hls.loadSource(streamUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!active) return;
            video.play().catch(() => {
              setIsPlaying(false);
            });
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            if (!active) return;
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls?.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls?.recoverMediaError();
                  break;
                default:
                  setHasError(true);
                  setIsLoaded(false);
                  hls?.destroy();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = streamUrl;
          const handleLoadedMetadata = () => {
            if (!active) return;
            video.play().catch(() => setIsPlaying(false));
          };
          const handleError = () => {
            if (!active) return;
            setHasError(true);
          };
          video.addEventListener('loadedmetadata', handleLoadedMetadata);
          video.addEventListener('error', handleError);
          cleanups.push(() => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
          });
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
        } catch (e) {
          console.error('Error destroying FLV player:', e);
        }
      }
      if (video) video.src = '';
    };
  }, [cctv, isMjpeg, isFlv, isIframe, isJsmpeg, isMp4, isPurwakarta]);

  // Sync isMuted and volume states to the HTML5 video element on load
  useEffect(() => {
    if (isMjpeg || isIframe || isJsmpeg) return;

    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      video.volume = volume;
    }
  }, [isLoaded, isMuted, volume, isMjpeg, isIframe, isJsmpeg]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isMjpeg || isIframe || isJsmpeg) return;

    const video = videoRef.current;
    if (!video || !isLoaded) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Handle Mute/Volume
  const toggleMute = () => {
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
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  // Handle Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error(err));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide controls when idle
  useEffect(() => {
    if (!showControls) return;
    if (!isPlaying) return;

    const timer = setTimeout(() => {
      setShowControls(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [showControls, isPlaying]);

  const handleMouseMove = () => {
    setShowControls(true);
  };

  // Take Snapshot
  const takeSnapshot = () => {
    if (isMjpeg) {
      const img = containerRef.current?.querySelector('img');
      if (!img || !isLoaded || !cctv) return;

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

      ctx.fillStyle = '#10b981'; // green accent
      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.fillText('NUSANTARA CCTV', 30, canvas.height - 24);

      const now = new Date();
      const formattedTime = now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) + ' ' + now.toLocaleTimeString('id-ID');

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(`|  ${cctv.name.toUpperCase()}  |  ${formattedTime}`, 220, canvas.height - 24);

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `CCTV_${cctv.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      } catch (e) {
        console.error('Failed to take screenshot:', e);
        alert('Gagal mengambil screenshot: Pemutar mendeteksi batasan keamanan CORS pada server stream CCTV asal.');
      }
      return;
    }

    // JSMpeg snapshot from canvas
    if (isJsmpeg) {
      const wrapper = jsmpegCanvasRef.current;
      const sourceCanvas = wrapper?.querySelector('canvas');
      if (!sourceCanvas || !isLoaded || !cctv) return;

      const canvas = document.createElement('canvas');
      canvas.width = sourceCanvas.width || 640;
      canvas.height = sourceCanvas.height || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.fillText('NUSANTARA CCTV', 30, canvas.height - 24);

      const now = new Date();
      const formattedTime = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + now.toLocaleTimeString('id-ID');
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(`|  ${cctv.name.toUpperCase()}  |  ${formattedTime}`, 220, canvas.height - 24);

      try {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `CCTV_${cctv.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      } catch (e) {
        console.error('Failed to take screenshot:', e);
        alert('Gagal mengambil screenshot.');
      }
      return;
    }

    const video = videoRef.current;
    if (!video || !isLoaded || !cctv) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    ctx.fillStyle = '#10b981'; // green accent
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillText('NUSANTARA CCTV', 30, canvas.height - 24);

    const now = new Date();
    const formattedTime = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('id-ID');

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Inter, sans-serif';
    ctx.fillText(`|  ${cctv.name.toUpperCase()}  |  ${formattedTime}`, 220, canvas.height - 24);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `CCTV_${cctv.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Failed to take screenshot:', e);
      alert('Gagal mengambil screenshot: Pemutar mendeteksi batasan keamanan CORS pada server stream CCTV asal.');
    }
  };

  return (
    <div 
      className={`map-video-overlay ${isFullscreen ? 'fullscreen' : ''} ${isRotated ? 'rotated-landscape' : ''}`} 
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(true)}
    >
      {/* Title bar (only in windowed mode) */}
      {!isFullscreen && !isRotated && (
        <div className="map-video-header">
          <div className="map-video-title-row">
            <Radio size={12} className="map-video-live-icon" />
            <span className="map-video-title">{cctv.name}</span>
          </div>
          <div className="map-video-actions">
            <button
              className={`map-video-btn map-video-fav ${isFavorite ? 'map-video-fav-active' : ''}`}
              onClick={onToggleFavorite}
              title={isFavorite ? "Hapus dari Favorit" : "Tambah ke Favorit"}
              aria-label={isFavorite ? "Hapus dari Favorit" : "Tambah ke Favorit"}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
            <button className="map-video-btn" onClick={toggleFullscreen} title="Layar Penuh" aria-label="Layar Penuh">
              <Maximize size={14} />
            </button>
            <button className="map-video-btn map-video-close" onClick={onClose} title="Tutup" aria-label="Tutup pemutar">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Video */}
      <div className="map-video-content" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Fullscreen Top Bar Overlay */}
        {(isFullscreen || isRotated) && (
          <div className={`map-video-fullscreen-top-bar ${showControls ? 'active' : ''}`}>
            <div className="top-left">
              <span className="fullscreen-live-badge">
                <span className="live-dot"></span>
                Live
              </span>
              <span className="fullscreen-cam-name">{cctv.name}</span>
            </div>
            <div className="top-right">
              <button 
                className="map-video-btn map-video-close" 
                onClick={onClose} 
                title="Tutup" 
                aria-label="Tutup pemutar"
                style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.25)', color: '#fff' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {!isLoaded && !hasError && (
          <div className="map-video-loading">
            <div className="map-video-spinner"></div>
            <span>Memuat stream...</span>
          </div>
        )}
        {hasError && (
          <div className="map-video-error">
            <span>⚠ Stream tidak tersedia</span>
          </div>
        )}

        <div 
          className="map-video-viewport"
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
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
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
              onClick={togglePlay}
            />
          )}
        </div>

        {/* Floating controls HUD that appears on hover */}
        {isLoaded && !hasError && (
          <div className={`map-video-hud ${showControls || !isPlaying ? 'active' : ''}`}>
            <div className="map-hud-controls-bar">
              <div className="controls-left">
                {!isMjpeg && !isIframe && (
                  <button
                    className="hud-btn"
                    onClick={togglePlay}
                    title={isPlaying ? "Jeda" : "Putar"}
                    aria-label={isPlaying ? "Jeda" : "Putar"}
                  >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>
                )}

                {!isMjpeg && !isIframe && (
                  <div className="volume-control-wrapper">
                    <button
                      className="hud-btn"
                      onClick={toggleMute}
                      title={isMuted ? "Bunyikan" : "Bisukan"}
                      aria-label={isMuted ? "Bunyikan" : "Bisukan"}
                    >
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="volume-slider"
                      title="Volume"
                      aria-label="Volume"
                    />
                  </div>
                )}
              </div>

              <div className="controls-right">
                {!isIframe && (
                  <button
                    className="hud-btn snapshot-btn"
                    onClick={takeSnapshot}
                    title="Ambil Foto CCTV"
                    aria-label="Ambil Foto CCTV"
                  >
                    <Camera size={14} />
                    <span>Ambil Foto</span>
                  </button>
                )}
                {isMobileDevice && (
                  <button
                    className={`hud-btn rotation-btn ${isRotated ? 'active' : ''}`}
                    onClick={() => setIsRotated(!isRotated)}
                    title={isRotated ? "Kembali ke Portrait" : "Putar ke Landscape"}
                    aria-label={isRotated ? "Kembali ke Portrait" : "Putar ke Landscape"}
                  >
                    <RotateCw size={14} className={isRotated ? 'rotated-icon' : ''} />
                  </button>
                )}
                <button
                  className="hud-btn"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                  aria-label={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
                >
                  <Maximize size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer (only in windowed mode) */}
      {!isFullscreen && !isRotated && (
        <div className="map-video-footer">
          <span className="map-video-live-badge">
            <span className="map-video-live-dot"></span>
            Live
          </span>
        </div>
      )}
    </div>
  );
};


interface LeafletMapProps {
  cctvs: CCTV[];
  onSelectCCTV: (cctv: CCTV | null) => void;
  selectedCCTV: CCTV | null;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  selectedProvince: string;
  selectedCity: string;
  user: User | null;
  onEditCCTV: (cctv: CCTV) => void;
  onDeleteCCTV: (id: string) => void;
}

// Coordinates dictionary for province and city centers
const provinceCenters: Record<string, { lat: number; lng: number; zoom: number }> = {
  'DI Yogyakarta': { lat: -7.7956, lng: 110.3695, zoom: 12 },
  'Jawa Timur': { lat: -7.5360, lng: 112.2331, zoom: 8.5 }, // covers Banyuwangi to Madiun nicely
  'Jawa Tengah': { lat: -7.150975, lng: 110.140259, zoom: 8.5 },
  'Jawa Barat': { lat: -6.9175, lng: 107.6191, zoom: 8.5 },
  'Sumatera Selatan': { lat: -2.9909, lng: 104.7567, zoom: 11 },
  'Kalimantan Selatan': { lat: -3.316694, lng: 114.590111, zoom: 12 },
  'Kalimantan Tengah': { lat: -2.692928, lng: 111.658969, zoom: 8.5 },
  'Kalimantan Barat': { lat: 0.9099, lng: 108.9889, zoom: 8.5 },
  'Kalimantan Utara': { lat: 3.3025, lng: 117.5936, zoom: 8.5 },
  'Sumatera Utara': { lat: 2.1121, lng: 99.0898, zoom: 8.5 },
  'Bali': { lat: -8.4095, lng: 115.1889, zoom: 10 },
  'Banten': { lat: -6.4058, lng: 106.0642, zoom: 9.5 },
  'Jambi': { lat: -1.6101, lng: 103.6131, zoom: 9.5 },
  'Sumatera Barat': { lat: -0.7399, lng: 100.8000, zoom: 8.5 },
  'Riau': { lat: 0.5070, lng: 101.4478, zoom: 9 },
  'Kepulauan Riau': { lat: 1.1301, lng: 104.0531, zoom: 9 },
  'Semua Provinsi': { lat: -7.1612, lng: 112.6524, zoom: 10 }
};

const cityCenters: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Kota Yogyakarta': { lat: -7.7956, lng: 110.3695, zoom: 13 },
  'Kab. Jombang': { lat: -7.5461, lng: 112.2331, zoom: 13 },
  'Kab. Gresik': { lat: -7.1612, lng: 112.6524, zoom: 12 },
  'Kab. Mojokerto': { lat: -7.4726, lng: 112.4381, zoom: 12 },
  'Kab. Banyuwangi': { lat: -8.2192, lng: 114.3691, zoom: 11 },
  'Kab. Banyumas': { lat: -7.424, lng: 109.239, zoom: 12 },
  'Kota Madiun': { lat: -7.6220, lng: 111.5225, zoom: 14 },
  'Kab. Magetan': { lat: -7.656107, lng: 111.325608, zoom: 12 },
  'Kab. Magelang': { lat: -7.504182, lng: 110.223830, zoom: 12 },
  'Kab. Sukoharjo': { lat: -7.6841, lng: 110.8243, zoom: 12 },
  'Kota Palembang': { lat: -2.9909, lng: 104.7567, zoom: 12 },
  'Kota Banjarmasin': { lat: -3.316694, lng: 114.590111, zoom: 13 },
  'Kab. Pati': { lat: -6.7536, lng: 111.0404, zoom: 12 },
  'Kab. Grobogan': { lat: -7.0874, lng: 110.9143, zoom: 12 },
  'Kota Salatiga': { lat: -7.3312, lng: 110.5005, zoom: 13 },
  'Kota Pematangsiantar': { lat: 2.9586, lng: 99.0574, zoom: 13 },
  'Kab. Boyolali': { lat: -7.408653, lng: 110.623076, zoom: 12 },
  'Kota Banjarbaru': { lat: -3.453726, lng: 114.803635, zoom: 13 },
  'Kab. Kotawaringin Barat': { lat: -2.692928, lng: 111.658969, zoom: 12 },
  'Kota Malang': { lat: -7.977836, lng: 112.633932, zoom: 13 },
  'Kab. Bondowoso': { lat: -7.911939, lng: 113.82297, zoom: 13 },
  'Kab. Tulungagung': { lat: -8.066, lng: 111.901, zoom: 12 },
  'Kota Semarang': { lat: -6.9908, lng: 110.4223, zoom: 13 },
  'Kota Batu': { lat: -7.8712, lng: 112.5262, zoom: 13 },
  'Kab. Bantul': { lat: -7.8938, lng: 110.3306, zoom: 12 },
  'Kota Cirebon': { lat: -6.7320, lng: 108.5523, zoom: 13 },
  'Kota Kediri': { lat: -7.8135, lng: 112.0090, zoom: 13 },
  'Kota Bogor': { lat: -6.5971, lng: 106.8060, zoom: 12 },
  'Kota Banjar': { lat: -7.370152, lng: 108.544060, zoom: 13 },
  'Kota Bandung': { lat: -6.9175, lng: 107.6191, zoom: 12 },
  'Kab. Kuningan': { lat: -6.9758, lng: 108.4800, zoom: 12 },
  'Kab. Jepara': { lat: -6.5896, lng: 110.6690, zoom: 12 },
  'Kota Singkawang': { lat: 0.9099, lng: 108.9889, zoom: 13 },
  'Kota Tarakan': { lat: 3.3025, lng: 117.5936, zoom: 13 },
  'Kab. Cianjur': { lat: -6.816, lng: 107.14, zoom: 12 },
  'Kab. Garut': { lat: -7.210, lng: 107.900, zoom: 12 },
  'Kab. Purwakarta': { lat: -6.5558, lng: 107.4421, zoom: 12 },
  'Kab. Buleleng': { lat: -8.1148, lng: 115.0910, zoom: 12 },
  'Kab. Tuban': { lat: -6.9008, lng: 112.0663, zoom: 12 },
  'Kota Bandar Lampung': { lat: -5.4404, lng: 105.2671, zoom: 12 },
  'Kab. Ciamis': { lat: -7.3274, lng: 108.3556, zoom: 12 },
  'Kab. Tangerang': { lat: -6.1781, lng: 106.4950, zoom: 12 },
  'Kota Serang': { lat: -6.1158, lng: 106.1542, zoom: 13 },
  'Kota Jambi': { lat: -1.6101, lng: 103.6131, zoom: 13 },
  'Kota Padang': { lat: -0.9471, lng: 100.4172, zoom: 12 },
  'Kota Solok': { lat: -0.7937, lng: 100.6586, zoom: 13 },
  'Kab. Sleman': { lat: -7.6974, lng: 110.3647, zoom: 12 },
  'Kab. Karanganyar': { lat: -7.6291, lng: 110.9997, zoom: 12 },
  'Kab. Kebumen': { lat: -7.6687, lng: 109.6517, zoom: 12 },
  'Kab. Rembang': { lat: -6.7118, lng: 111.3414, zoom: 12 },
  'Kab. Temanggung': { lat: -7.3135, lng: 110.1654, zoom: 12 },
  'Kab. Wonosobo': { lat: -7.3576, lng: 109.9023, zoom: 12 },
  'Kab. Wonogiri': { lat: -7.8137, lng: 110.9255, zoom: 12 },
  'Kab. Nganjuk': { lat: -7.601, lng: 111.903, zoom: 12 },
  'Kota Surabaya': { lat: -7.28, lng: 112.75, zoom: 12 },
  'Kota Pekanbaru': { lat: 0.5070, lng: 101.4478, zoom: 12 },
  'Kota Batam': { lat: 1.1301, lng: 104.0531, zoom: 12 }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'traffic': return 'Lalu Lintas';
    case 'public': return 'Fasilitas Umum';
    case 'tourism': return 'Wisata';
    default: return category;
  }
};

interface CCTVMarkerProps {
  cctv: CCTV;
  isFavorite: boolean;
  onSelect: (cctv: CCTV) => void;
  onToggleFavorite: (id: string) => void;
  onHover: (cctv: CCTV | null, pos: { lat: number; lng: number } | null) => void;
  showDotOnly: boolean;
  showAnimation: boolean;
  user: any;
  onEdit: (cctv: CCTV) => void;
  onDelete: (id: string) => void;
}

const CCTVMarker = React.memo<CCTVMarkerProps>(({
  cctv,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onHover,
  showDotOnly,
  showAnimation,
  user,
  onEdit,
  onDelete
}) => {
  const eventHandlers = React.useMemo(() => ({
    mouseover: () => {
      onHover(cctv, { lat: cctv.lat, lng: cctv.lng });
    },
    mouseout: () => {
      onHover(null, null);
    }
  }), [cctv, onHover]);

  return (
    <Marker 
      position={[cctv.lat, cctv.lng]}
      icon={
        showDotOnly
          ? showAnimation
            ? (cctv.status === 'online' ? ONLINE_DOT_ICON : OFFLINE_DOT_ICON)
            : (cctv.status === 'online' ? ONLINE_DOT_ICON_NO_ANIM : OFFLINE_DOT_ICON_NO_ANIM)
          : showAnimation
            ? (cctv.status === 'online' ? ONLINE_ICON : OFFLINE_ICON)
            : (cctv.status === 'online' ? ONLINE_ICON_NO_ANIM : OFFLINE_ICON_NO_ANIM)
      }
      alt={`Kamera CCTV ${cctv.name} - ${cctv.status === 'online' ? 'Online' : 'Offline'}`}
      eventHandlers={eventHandlers}
    >
      <Popup className="map-popup-custom">
        <div className="map-popup-card">
          <div className="popup-header">
            <span className={`status-badge ${cctv.status === 'online' ? 'status-online' : 'status-offline'}`}>
              <span className="pulse-dot"></span>
              <span>{cctv.status === 'online' ? 'ONLINE' : 'OFFLINE'}</span>
            </span>
            <span className="popup-category">
              <Tag size={10} />
              <span>{getCategoryLabel(cctv.category)}</span>
            </span>
          </div>
          
          <h3 className="popup-title">{cctv.name}</h3>
          
          <div className="popup-loc">
            <MapPin size={10} />
            <span>{cctv.city}, {cctv.province}</span>
          </div>

          <p className="popup-desc">{cctv.description}</p>
          
          <div className="popup-actions-row">
            <button
              id={`btn-map-popup-play-${cctv.id}`}
              className={`btn-primary popup-play-btn ${cctv.status === 'offline' ? 'disabled' : ''}`}
              onClick={() => cctv.status === 'online' && onSelect(cctv)}
              disabled={cctv.status === 'offline'}
            >
              <Play size={10} fill="currentColor" />
              <span>Pantau Live</span>
            </button>
            <button
              id={`btn-map-popup-fav-${cctv.id}`}
              className={`popup-fav-btn ${isFavorite ? 'active' : ''}`}
              onClick={() => onToggleFavorite(cctv.id)}
              title={isFavorite ? "Hapus dari Favorit" : "Tambah ke Favorit"}
              aria-label={isFavorite ? "Hapus dari Favorit" : "Tambah ke Favorit"}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>

          {user && user.email === 'planetkapal@gmail.com' && (
            <div className="popup-admin-actions" style={{ display: 'flex', gap: '6px', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
              <button
                type="button"
                className="popup-admin-btn edit-btn"
                onClick={() => onEdit(cctv)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  fontSize: '0.75rem',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                Ubah
              </button>
              <button
                type="button"
                className="popup-admin-btn delete-btn"
                onClick={() => onDelete(cctv.id)}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  fontSize: '0.75rem',
                  padding: '5px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

CCTVMarker.displayName = 'CCTVMarker';

export const LeafletMap: React.FC<LeafletMapProps> = ({
  cctvs,
  onSelectCCTV,
  selectedCCTV,
  favorites,
  onToggleFavorite,
  selectedProvince,
  selectedCity,
  user,
  onEditCCTV,
  onDeleteCCTV
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [watchingCCTV, setWatchingCCTV] = useState<CCTV | null>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [hoveredCCTV, setHoveredCCTV] = useState<CCTV | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(10);

  // Filter CCTVs to only render those currently within padded map bounds
  const visibleCCTVs = React.useMemo(() => {
    if (!mapBounds) return cctvs;
    // Pad bounds by 10% to pre-render markers just outside the view for smooth dragging
    const paddedBounds = mapBounds.pad(0.1);
    const inBounds = cctvs.filter((cctv) => paddedBounds.contains([cctv.lat, cctv.lng]));

    // Thin out markers at low zoom levels to keep the map fast & responsive, especially on mobile
    const maxMarkers = isMobileDevice ? 150 : 250;
    if (inBounds.length > maxMarkers && currentZoom < 12) {
      const step = Math.ceil(inBounds.length / maxMarkers);
      return inBounds.filter((_, index) => index % step === 0);
    }
    return inBounds;
  }, [cctvs, mapBounds, currentZoom]);

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; zoom: number }>(() => {
    if (selectedCity && selectedCity !== 'Semua Kota' && cityCenters[selectedCity]) {
      return cityCenters[selectedCity];
    }
    if (selectedProvince && provinceCenters[selectedProvince]) {
      return provinceCenters[selectedProvince];
    }
    return { lat: -7.1612, lng: 112.6524, zoom: 10 };
  });

  // Keep a stable ref to onSelectCCTV so we can call it inside effects
  // without adding it to dependency arrays (which would re-trigger effects on every render).
  const onSelectCCTVRef = useRef(onSelectCCTV);
  useEffect(() => {
    onSelectCCTVRef.current = onSelectCCTV;
  }, [onSelectCCTV]);

  // Track whether this is the initial mount so we don't clear the player on first render
  const isInitialMount = useRef(true);

  // Update map center and close active player when province or city selection changes
  useEffect(() => {
    // Skip the initial mount — we don't want to reset anything when the component first renders
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (selectedCity && selectedCity !== 'Semua Kota') {
      const center = cityCenters[selectedCity];
      if (center) {
        setMapCenter(center);
        setWatchingCCTV(null);
        onSelectCCTVRef.current(null);
      }
    } else if (selectedProvince) {
      const center = provinceCenters[selectedProvince];
      if (center) {
        setMapCenter(center);
        setWatchingCCTV(null);
        onSelectCCTVRef.current(null);
      }
    }
  }, [selectedProvince, selectedCity]);

  // Update map center when a specific CCTV is selected/clicked
  useEffect(() => {
    console.log('[LeafletMap] selectedCCTV effect. selected:', selectedCCTV?.name, 'user:', user?.email);
    if (selectedCCTV) {
      if (selectedCCTV.id !== 'bantul-14' && !user) {
        console.log('[LeafletMap] selectedCCTV is restricted and user is not logged in. Skip autoplay.');
        return;
      }
      console.log('[LeafletMap] autoplaying selectedCCTV:', selectedCCTV.name);
      setMapCenter({
        lat: selectedCCTV.lat,
        lng: selectedCCTV.lng,
        zoom: 13
      });
      setWatchingCCTV(selectedCCTV);
    }
  }, [selectedCCTV, user]);

  const { lat, lng, zoom } = mapCenter;

  const onToggleFavoriteRef = useRef(onToggleFavorite);
  useEffect(() => {
    onToggleFavoriteRef.current = onToggleFavorite;
  }, [onToggleFavorite]);

  const handleToggleFavorite = React.useCallback((id: string) => {
    onToggleFavoriteRef.current(id);
  }, []);

  const handleHover = React.useCallback((cctv: CCTV | null, pos: { lat: number; lng: number } | null) => {
    setHoveredCCTV(cctv);
    setTooltipPos(pos);
  }, []);

  const handlePantauLive = React.useCallback((cctv: CCTV) => {
    if (cctv.id !== 'bantul-14' && !user) {
      onSelectCCTVRef.current(cctv);
      return;
    }
    setWatchingCCTV(cctv);
    onSelectCCTVRef.current(cctv);
  }, [user]);

  return (
    <div 
      ref={wrapperRef}
      className={`map-view-wrapper ${watchingCCTV ? 'video-active' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <MapContainer 
        center={[lat, lng]} 
        zoom={zoom} 
        scrollWheelZoom={true}
        maxZoom={19}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapController lat={lat} lng={lng} zoom={zoom} />
        <MapBoundsTracker onBoundsChange={setMapBounds} onZoomChange={setCurrentZoom} />
        <PopupCloser watching={watchingCCTV} />
        <ZoomControl position="bottomright" />
        {/* OpenStreetMap Standard Light TileLayer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {visibleCCTVs.map((cctv) => (
          <CCTVMarker 
            key={cctv.id}
            cctv={cctv}
            isFavorite={favorites.includes(cctv.id)}
            onSelect={handlePantauLive}
            onToggleFavorite={handleToggleFavorite}
            onHover={handleHover}
            showDotOnly={currentZoom < 13}
            showAnimation={!isMobileDevice && currentZoom > 11}
            user={user}
            onEdit={onEditCCTV}
            onDelete={onDeleteCCTV}
          />
        ))}

        {hoveredCCTV && tooltipPos && (
          <Marker
            position={[tooltipPos.lat, tooltipPos.lng]}
            icon={L.divIcon({ className: 'dummy-tooltip-marker', html: '' })}
            interactive={false}
          >
            <Tooltip direction="top" offset={[0, -30]} permanent opacity={0.95}>
              <div className="cctv-map-tooltip">
                <span className="tooltip-name">{hoveredCCTV.name}</span>
                <span className="tooltip-loc">{hoveredCCTV.city}, {hoveredCCTV.province}</span>
              </div>
            </Tooltip>
          </Marker>
        )}
      </MapContainer>

      {/* Floating video player overlay */}
      {watchingCCTV && (watchingCCTV.id === 'bantul-14' || user) && (
        <div
          className="map-video-backdrop"
          onClick={() => setWatchingCCTV(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <MapVideoPlayer
              key={watchingCCTV.id}
              cctv={watchingCCTV}
              onClose={() => setWatchingCCTV(null)}
              isFavorite={favorites.includes(watchingCCTV.id)}
              onToggleFavorite={() => onToggleFavorite(watchingCCTV.id)}
            />
          </div>
        </div>
      )}

      <style>{`
        /* Custom Tooltip Styles */
        .leaflet-tooltip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid var(--border-color) !important;
          border-radius: var(--radius-sm) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
          color: var(--text-primary) !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 0.75rem !important;
          padding: 6px 10px !important;
          font-weight: 500 !important;
        }
        
        .cctv-map-tooltip {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tooltip-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .tooltip-loc {
          font-size: 0.65rem;
          color: var(--text-secondary);
        }

        .leaflet-tooltip-top:before {
          border-top-color: rgba(15, 23, 42, 0.95) !important;
        }

        /* CCTV Pin Marker Styles */
        .custom-cctv-marker {
          background: transparent !important;
          border: none !important;
        }

        .cctv-pin-marker {
          position: relative;
          width: 32px;
          height: 42px;
          cursor: pointer;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          transition: transform 0.15s ease;
        }

        .cctv-pin-marker:hover {
          transform: scale(1.2) translateY(-4px);
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
        }

        .cctv-pin-pulse {
          position: absolute;
          bottom: 0;
          left: 50%;
          margin-left: -4px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3b82f6;
          pointer-events: none;
        }

        .cctv-pin-pulse::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: inherit;
          animation: cctv-pulse-scale 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          will-change: transform, opacity;
        }

        @keyframes cctv-pulse-scale {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(3.5);
            opacity: 0;
          }
        }

        /* Disable marker pulses when video is playing */
        .video-active .cctv-pin-pulse,
        .video-active .cctv-pin-pulse::after {
          animation: none !important;
          display: none !important;
        }

        /* Map popup cards */
        .map-popup-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 240px;
          padding: 4px;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .popup-category {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary);
          font-size: 0.65rem;
          font-weight: 500;
        }

        .popup-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          margin-top: 2px;
        }

        .popup-loc {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          color: var(--text-secondary);
        }

        .popup-desc {
          font-size: 0.7rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .popup-actions-row {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin-top: 4px;
        }

        .popup-play-btn {
          flex: 1;
          padding: 8px 12px;
          font-size: 0.8rem;
          gap: 6px;
        }

        .popup-play-btn.disabled {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
        }

        .popup-fav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .popup-fav-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .popup-fav-btn.active {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        /* Custom Leaflet overrides */
        .leaflet-popup-content {
          margin: 12px !important;
        }

        /* ============================================= */
        /* Map Floating Video Player Overlay             */
        /* ============================================= */
        .map-video-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
          pointer-events: none; /* Let clicks pass through to Leaflet map */
        }

        .map-video-overlay {
          position: absolute;
          top: 24px; /* Center-top position */
          left: 50%;
          transform: translate(-50%, 0);
          width: 560px;
          max-width: calc(100% - 48px);
          z-index: 1000;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
          overflow: hidden;
          animation: slideInVideo 0.3s ease-out;
          pointer-events: auto; /* Make the player overlay interactive */
        }

        @keyframes slideInVideo {
          from {
            opacity: 0;
            transform: translate(-50%, 0) translateY(-12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) translateY(0) scale(1);
          }
        }

        .map-video-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.5);
          border-bottom: 1px solid var(--border-color);
        }

        .map-video-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .map-video-live-icon {
          color: #ef4444;
          flex-shrink: 0;
        }

        .map-video-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .map-video-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .map-video-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          border-radius: 6px;
          padding: 5px 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 0.7rem;
        }

        .map-video-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
        }

        .map-video-btn.map-video-fav:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .map-video-btn.map-video-fav-active {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.3) !important;
          color: #ef4444 !important;
        }

        .map-video-close:hover {
          background: rgba(239, 68, 68, 0.3);
          color: #ef4444;
        }

        .map-video-content {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
          overflow: hidden;
        }

        .map-video-loading,
        .map-video-error {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .map-video-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255,255,255,0.1);
          border-top-color: var(--accent-blue);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .map-video-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          background: rgba(0, 0, 0, 0.5);
          border-top: 1px solid var(--border-color);
        }

        .map-video-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #ef4444;
        }

        .map-video-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
        }

        .map-video-clock {
          display: inline-flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.85);
          font-family: monospace;
          font-size: 0.75rem;
        }

        /* HUD Overlay style for map video content */
        .map-video-hud {
          position: absolute;
          left: 50%;
          bottom: 12px;
          transform: translate(-50%, 8px);
          width: calc(100% - 24px);
          max-width: 440px;
          z-index: 20;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .map-video-hud.active,
        .map-video-content:hover .map-video-hud {
          opacity: 1;
          pointer-events: auto;
          transform: translate(-50%, 0);
        }

        .map-hud-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 8px 16px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          gap: 12px;
        }

        .controls-left, .controls-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hud-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .hud-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }

        .hud-btn.snapshot-btn {
          gap: 6px;
          padding: 0 12px;
          width: auto;
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .hud-btn.snapshot-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
        }

        .volume-control-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .volume-slider {
          width: 60px;
          height: 4px;
          appearance: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .volume-slider:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          transition: transform 0.1s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }

        .volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }

        .volume-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border: none;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }

        /* Fullscreen Top Bar Overlay */
        .map-video-fullscreen-top-bar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 16px 24px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 20;
          opacity: 0;
          pointer-events: none;
          transform: translateY(-8px);
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .map-video-fullscreen-top-bar.active,
        .map-video-content:hover .map-video-fullscreen-top-bar {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        .map-video-fullscreen-top-bar .top-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fullscreen-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ef4444;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          letter-spacing: 0.05em;
        }

        .fullscreen-live-badge .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ffffff;
        }

        .fullscreen-cam-name {
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .map-video-fullscreen-top-bar .top-right {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.9);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9rem;
          font-weight: 600;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }



        /* Fullscreen handling for map overlay player */
        .map-video-overlay.fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          transform: none !important;
          border-radius: 0 !important;
          z-index: 99999 !important;
          display: flex !important;
          flex-direction: column !important;
          background: #000000 !important;
          box-shadow: none !important;
          border: none !important;
        }

        .map-video-overlay.fullscreen .map-video-content {
          width: 100% !important;
          height: 100% !important;
          flex: 1 !important;
          aspect-ratio: auto !important;
        }

        .map-video-overlay.fullscreen .map-video-hud {
          bottom: 24px;
          max-width: 480px;
        }

        .map-video-overlay.fullscreen .map-video-footer {
          display: none !important;
        }

        /* Rotated landscape handling for map overlay player on mobile */
        .map-video-overlay.rotated-landscape,
        .map-video-overlay.fullscreen.rotated-landscape {
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

        .map-video-overlay.rotated-landscape .map-video-content,
        .map-video-overlay.fullscreen.rotated-landscape .map-video-content {
          width: 100% !important;
          height: 100% !important;
          flex: 1 !important;
          aspect-ratio: auto !important;
        }

        .map-video-overlay.rotated-landscape .map-video-hud,
        .map-video-overlay.fullscreen.rotated-landscape .map-video-hud {
          bottom: 24px;
          max-width: 480px;
        }

        .map-video-viewport {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: none;
        }

        .hud-btn.rotation-btn.active {
          color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          border: 1px solid rgba(59, 130, 246, 0.3) !important;
        }

        .hud-btn.rotation-btn svg {
          transition: transform 0.3s ease;
        }

        .hud-btn.rotation-btn.active svg {
          transform: rotate(-90deg);
        }

        /* Responsive for smaller screens */
        @media (max-width: 768px) {
          .map-video-overlay {
            width: calc(100% - 32px);
          }
          .map-hud-controls-bar {
            padding: 6px 12px;
          }
          .hud-btn.snapshot-btn span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
export default LeafletMap;
