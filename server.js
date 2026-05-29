import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable TLS verification for some regional ATCS domains (e.g. Malang Kota)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Gzip/Brotli compression for performance optimization
app.use(compression());

// ==============================
// LAYER 4: CORS Whitelist & Security Headers
// ==============================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:4173',
  /\.vercel\.app$/
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl in dev)
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Block direct access to raw database file
app.use('/server/data', (req, res) => {
  res.status(403).json({ message: 'Akses langsung ke database tidak diizinkan.' });
});

// ==============================
// LAYER 1: HMAC Signature Validation
// ==============================
const API_SECRET = 'nusantara-cctv-api-key-2026';
const SIGNATURE_MAX_AGE_SECONDS = 30;

function validateApiSignature(req, res, next) {
  const signature = req.headers['x-api-signature'];
  const timestamp = req.headers['x-api-timestamp'];

  if (!signature || !timestamp) {
    console.warn(`[Security] Missing signature/timestamp from ${req.ip}`);
    return res.status(403).json({ message: 'Akses ditolak. Signature diperlukan.' });
  }

  // Check timestamp freshness
  const now = Math.floor(Date.now() / 1000);
  const reqTime = parseInt(timestamp, 10);
  if (isNaN(reqTime) || Math.abs(now - reqTime) > SIGNATURE_MAX_AGE_SECONDS) {
    console.warn(`[Security] Expired timestamp from ${req.ip}: ${timestamp}`);
    return res.status(403).json({ message: 'Akses ditolak. Timestamp kadaluwarsa.' });
  }

  // Validate HMAC
  const message = `${timestamp}:${req.path}`;
  const expectedSignature = crypto
    .createHmac('sha256', API_SECRET)
    .update(message)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.warn(`[Security] Invalid signature from ${req.ip}`);
    return res.status(403).json({ message: 'Akses ditolak. Signature tidak valid.' });
  }

  next();
}

// ==============================
// LAYER 2: Rate Limiting (In-Memory)
// ==============================
const rateLimitMap = new Map(); // IP -> { count, resetTime }
const RATE_LIMIT_MAX = 10;       // max requests
const RATE_LIMIT_WINDOW = 60000; // per 60 seconds

function rateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(ip, entry);
  }

  entry.count++;

  if (entry.count > RATE_LIMIT_MAX) {
    console.warn(`[Rate Limit] IP ${ip} exceeded ${RATE_LIMIT_MAX} requests/min`);
    res.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
    return res.status(429).json({ message: 'Terlalu banyak permintaan. Coba lagi nanti.' });
  }

  next();
}

// Cleanup expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetTime) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

// ==============================
// LAYER 3: Response Obfuscation Helper
// ==============================
function obfuscateResponse(data) {
  const jsonStr = JSON.stringify(data);
  const reversed = jsonStr.split('').reverse().join('');
  const encoded = Buffer.from(reversed).toString('base64');
  return { d: encoded };
}

// Load CCTV Database
const dbPath = path.join(__dirname, 'server/data/cctvData.json');
let cctvData = [];
try {
  cctvData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  console.log(`[Database] Loaded ${cctvData.length} CCTV records.`);
} catch (e) {
  console.error('[Database] Failed to load cctvData.json:', e.message);
}

// Background Cookie Refreshing logic
let malangCookies = '';
async function refreshMalangCookies() {
  try {
    const res = await fetch('https://cctv.malangkota.go.id/sebaran-cctv', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const cookies = res.headers.getSetCookie();
    if (cookies && cookies.length > 0) {
      malangCookies = cookies.map(c => c.split(';')[0]).join('; ');
      console.log('[Malang Cookie Refresh] Cookies updated successfully.');
    }
  } catch (err) {
    console.error('[Malang Cookie Refresh] Failed:', err.message);
  }
}

let singkawangCookies = '';
async function refreshSingkawangCookies() {
  try {
    const res = await fetch('https://pantau.singkawangkota.go.id/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const cookies = res.headers.getSetCookie();
    if (cookies && cookies.length > 0) {
      singkawangCookies = cookies.map(c => c.split(';')[0]).join('; ');
      console.log('[Singkawang Cookie Refresh] Cookies updated successfully.');
    }
  } catch (err) {
    console.error('[Singkawang Cookie Refresh] Failed:', err.message);
  }
}

// Start cookie refresh intervals
refreshMalangCookies();
setInterval(refreshMalangCookies, 5 * 60 * 1000);

refreshSingkawangCookies();
setInterval(refreshSingkawangCookies, 5 * 60 * 1000);

let bontangSession = '';
async function refreshBontangSession() {
  try {
    const res = await fetch('https://intip.bontangkota.go.id/token.json');
    if (res.ok) {
      const data = await res.json();
      if (data.session) {
        bontangSession = data.session;
        console.log('[Bontang Session Refresh] Session updated.');
      }
    }
  } catch (err) {
    console.error('[Bontang Session Refresh] Failed:', err.message);
  }
}
refreshBontangSession();
setInterval(refreshBontangSession, 5 * 60 * 1000);


// Helper for CORS proxy response headers
function configureCorsHeaders(proxyRes) {
  if (proxyRes.headers) {
    delete proxyRes.headers['access-control-allow-origin'];
    delete proxyRes.headers['access-control-allow-credentials'];
    delete proxyRes.headers['access-control-allow-headers'];
    delete proxyRes.headers['access-control-allow-methods'];
  }
  proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  proxyRes.headers['Access-Control-Allow-Private-Network'] = 'true';
}

// Firebase JWT token verification setup
const firebaseProjectId = 'nusantara-cctv';
const jwksClientInstance = jwksRsa({
  jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  cache: true,
  rateLimit: true
});

function getKey(header, callback) {
  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
    } else {
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    }
  });
}

function authenticateFirebaseToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Autentikasi diperlukan. Token tidak ditemukan.' });
  }

  jwt.verify(token, getKey, {
    audience: firebaseProjectId,
    issuer: `https://securetoken.google.com/${firebaseProjectId}`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.error('[Auth Error] Token verification failed:', err.message);
      return res.status(403).json({ message: 'Akses ditolak. Token tidak valid atau kadaluwarsa.' });
    }
    req.user = decoded;
    next();
  });
}

function authenticateAdminToken(req, res, next) {
  authenticateFirebaseToken(req, res, () => {
    if (!req.user || !req.user.email || req.user.email.toLowerCase() !== 'planetkapal@gmail.com') {
      console.warn(`[Unauthorized Access] Non-admin user ${req.user ? req.user.email : 'unknown'} attempted to modify/delete CCTV`);
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin (planetkapal@gmail.com) yang diizinkan melakukan tindakan ini.' });
    }
    next();
  });
}

// REST API Endpoints (Protected with signature + rate limiting + obfuscation)
app.get('/api/cctvs', rateLimiter, validateApiSignature, (req, res) => {
  res.json(obfuscateResponse(cctvData));
});

// Capture client-side debug logs in server output
app.post('/api/debug-log', (req, res) => {
  console.log('[CLIENT DEBUG]', req.body);
  try {
    const logFilePath = path.join(__dirname, 'debug.log');
    const logLine = `[${new Date().toISOString()}] ${JSON.stringify(req.body)}\n`;
    fs.appendFileSync(logFilePath, logLine, 'utf-8');
  } catch (err) {
    console.error('[Debug Log File Error]', err.message);
  }
  res.json({ success: true });
});

// Add CCTV (Protected)
app.post('/api/cctvs', authenticateFirebaseToken, (req, res) => {
  const { name, city, province, lat, lng, streamUrl, category, status, description } = req.body;

  if (!name || !city || !province || lat === undefined || lng === undefined || !streamUrl || !category || !status) {
    return res.status(400).json({ message: 'Seluruh parameter utama CCTV harus diisi.' });
  }

  // Generate a unique ID
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  let id = `${province.toLowerCase().substring(0, 3)}-${baseSlug}`;
  
  // Make sure ID is unique
  let suffix = 1;
  while (cctvData.some(c => c.id === id)) {
    id = `${province.toLowerCase().substring(0, 3)}-${baseSlug}-${suffix}`;
    suffix++;
  }

  const newCctv = {
    id,
    name,
    city,
    province,
    lat: Number(lat),
    lng: Number(lng),
    streamUrl,
    category,
    status,
    description: description || ''
  };

  cctvData.push(newCctv);

  try {
    fs.writeFileSync(dbPath, JSON.stringify(cctvData, null, 2), 'utf-8');
    console.log(`[Database] CCTV Added: ${newCctv.name} by ${req.user.email}`);
    res.status(201).json(newCctv);
  } catch (err) {
    console.error('[Database Error] Failed to write database:', err.message);
    res.status(500).json({ message: 'Gagal menyimpan data ke database server.' });
  }
});

// Edit CCTV (Protected)
app.put('/api/cctvs/:id', authenticateAdminToken, (req, res) => {
  const { id } = req.params;
  const { name, city, province, lat, lng, streamUrl, category, status, description } = req.body;

  const index = cctvData.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Kamera CCTV tidak ditemukan.' });
  }

  if (!name || !city || !province || lat === undefined || lng === undefined || !streamUrl || !category || !status) {
    return res.status(400).json({ message: 'Seluruh parameter utama CCTV harus diisi.' });
  }

  const updatedCctv = {
    ...cctvData[index],
    name,
    city,
    province,
    lat: Number(lat),
    lng: Number(lng),
    streamUrl,
    category,
    status,
    description: description || ''
  };

  cctvData[index] = updatedCctv;

  try {
    fs.writeFileSync(dbPath, JSON.stringify(cctvData, null, 2), 'utf-8');
    console.log(`[Database] CCTV Updated: ${updatedCctv.name} by ${req.user.email}`);
    res.json(updatedCctv);
  } catch (err) {
    console.error('[Database Error] Failed to write database:', err.message);
    res.status(500).json({ message: 'Gagal menyimpan data ke database server.' });
  }
});

// Delete CCTV (Protected)
app.delete('/api/cctvs/:id', authenticateAdminToken, (req, res) => {
  const { id } = req.params;

  const index = cctvData.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ message: 'Kamera CCTV tidak ditemukan.' });
  }

  const deletedName = cctvData[index].name;
  cctvData.splice(index, 1);

  try {
    fs.writeFileSync(dbPath, JSON.stringify(cctvData, null, 2), 'utf-8');
    console.log(`[Database] CCTV Deleted: ${deletedName} by ${req.user.email}`);
    res.json({ success: true, message: `CCTV ${deletedName} berhasil dihapus.` });
  } catch (err) {
    console.error('[Database Error] Failed to write database:', err.message);
    res.status(500).json({ message: 'Gagal menyimpan data ke database server.' });
  }
});

// Banjar Dynamic Stream Endpoint
app.get('/api/banjar-stream/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const getStreamUrl = `https://cctv.banjarkab.go.id/get_stream.php?id=${id}`;
    const streamRes = await fetch(getStreamUrl);
    if (!streamRes.ok) {
      return res.status(streamRes.status).send(`Failed to get stream URL for camera ${id}`);
    }
    const streamData = await streamRes.json();
    const targetUrl = streamData.url;
    if (!targetUrl) {
      return res.status(404).send(`No stream URL found for camera ${id}`);
    }

    const playlistRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!playlistRes.ok) {
      return res.status(playlistRes.status).send(`Failed to fetch playlist for camera ${id}`);
    }

    let playlistText = await playlistRes.text();
    playlistText = playlistText.replaceAll('proxy.php?', '/banjar-stream/proxy.php?');

    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(playlistText);
  } catch (err) {
    console.error(`[Banjar Stream] Error for ID ${id}:`, err.message);
    res.status(500).send('Internal Server Error');
  }
});

// Bontang Dynamic Stream and Snapshot Endpoints
app.get('/api/bontang-stream/:cameraId/stream.mp4', (req, res) => {
  const { cameraId } = req.params;
  res.redirect(`https://i-see.iconpln.co.id/ckexo/media?session=${bontangSession}&cameraId=${cameraId}&format=fmp4&frames=all&media=video&t=live`);
});

app.get('/api/bontang-snapshot/:cameraId', (req, res) => {
  const { cameraId } = req.params;
  res.redirect(`https://i-see.iconpln.co.id/ckexo/media?session=${bontangSession}&cameraId=${cameraId}&format=jpeg&frames=1&media=image`);
});

// Kutai Timur Dynamic Stream Wakeup and Proxy Endpoint
app.get('/api/kutim-stream/:streamKey', async (req, res) => {
  const { streamKey } = req.params;
  try {
    const startUrl = `https://apicctv.kutaitimurkab.go.id/api/stream/${streamKey}/start`;
    const triggerRes = await fetch(startUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log(`[Kutim Stream Wakeup] ${streamKey} -> Status: ${triggerRes.status}`);
  } catch (err) {
    console.error(`[Kutim Stream Wakeup Error] ${streamKey}:`, err.message);
  }
  res.redirect(`/kutim-hls/${streamKey}/index.m3u8`);
});

// Proxy setups for different region stream sources
const createCctvProxy = (prefix, target, options = {}) => {
  app.use(prefix, createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false,
    pathRewrite: options.pathRewrite,
    followRedirects: options.followRedirects,
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
        if (options.origin) proxyReq.setHeader('Origin', options.origin);
        if (options.referer) proxyReq.setHeader('Referer', options.referer);
        if (options.userAgent) proxyReq.setHeader('User-Agent', options.userAgent);
        if (options.cookies) proxyReq.setHeader('Cookie', options.cookies);
      },
      proxyRes: (proxyRes, req, res) => {
        console.log(`[Proxy Response] ${req.method} ${req.originalUrl} -> Target Status: ${proxyRes.statusCode}, Content-Type: ${proxyRes.headers['content-type']}`);
        configureCorsHeaders(proxyRes);
      }
    }
  }));
};

// Mount CORS stream proxies
createCctvProxy('/gresik-api', 'https://testing-apicctv.gresikkab.go.id', {
  origin: 'https://cctvkanjeng.gresikkab.go.id',
  referer: 'https://cctvkanjeng.gresikkab.go.id/'
});

createCctvProxy('/bwi-hls', 'https://live.banyuwangikab.go.id/hls', {
  origin: 'https://live.banyuwangikab.go.id',
  referer: 'https://live.banyuwangikab.go.id/'
});

createCctvProxy('/bjm-stream', 'https://atcs.banjarmasinkota.go.id/stream', {
  origin: 'https://atcs.banjarmasinkota.go.id',
  referer: 'https://atcs.banjarmasinkota.go.id/'
});

createCctvProxy('/pati-stream', 'https://streaming.patikab.go.id');
createCctvProxy('/grobogan-cradnu', 'https://dishub.cradnu.com');
createCctvProxy('/grobogan-stream', 'https://stream.dishub.grobogan.go.id');

createCctvProxy('/kobar-stream', 'https://cctv.kotawaringinbaratkab.go.id', {
  origin: 'https://cctv.kotawaringinbaratkab.go.id',
  referer: 'https://cctv.kotawaringinbaratkab.go.id/'
});

// Dynamic cookies proxy for Malang
app.use('/malang-stream', createProxyMiddleware({
  target: 'https://cctv.malangkota.go.id',
  changeOrigin: true,
  secure: false,
  on: {
    proxyReq: (proxyReq) => {
      if (malangCookies) {
        proxyReq.setHeader('Cookie', malangCookies);
      }
      proxyReq.setHeader('Referer', 'https://cctv.malangkota.go.id/sebaran-cctv');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    },
    proxyRes: (proxyRes) => {
      configureCorsHeaders(proxyRes);
    }
  }
}));

createCctvProxy('/cirebon-stream', 'https://cctv.cirebonkota.go.id', {
  origin: 'https://cctv.cirebonkota.go.id',
  referer: 'https://cctv.cirebonkota.go.id/'
});

createCctvProxy('/bandung-stream', 'https://atcs-dishub.bandung.go.id:1990', {
  origin: 'https://atcs-dishub.bandung.go.id',
  referer: 'https://atcs-dishub.bandung.go.id/'
});

createCctvProxy('/kuningan-stream', 'https://cctv.kuningankab.go.id', {
  origin: 'https://cctv.kuningankab.go.id',
  referer: 'https://cctv.kuningankab.go.id/'
});

createCctvProxy('/jepara-lifemedia', 'https://cctv-jepara.lifemedia.id', {
  origin: 'https://samudra.jepara.go.id',
  referer: 'https://samudra.jepara.go.id/'
});

createCctvProxy('/jepara-stream-8083', 'https://stream-cctv.jepara.go.id:8083');
createCctvProxy('/jepara-stream-8084', 'https://stream-cctv.jepara.go.id:8084');

// Dynamic cookies proxy for Singkawang
app.use('/singkawang-stream', createProxyMiddleware({
  target: 'https://pantau.singkawangkota.go.id',
  changeOrigin: true,
  secure: false,
  on: {
    proxyReq: (proxyReq) => {
      if (singkawangCookies) {
        proxyReq.setHeader('Cookie', singkawangCookies);
      }
      proxyReq.setHeader('Referer', 'https://pantau.singkawangkota.go.id/');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    },
    proxyRes: (proxyRes) => {
      configureCorsHeaders(proxyRes);
    }
  }
}));

createCctvProxy('/tarakan-stream', 'https://rtmp.kotatarakan.id', {
  referer: 'https://cctv.kotatarakan.id/'
});

createCctvProxy('/purwakarta-stream', 'https://cctv.purwakartakab.go.id');
createCctvProxy('/tuban-api', 'https://cctv.tubankab.go.id/api');
createCctvProxy('/tuban-stream', 'https://cctv.tubankab.go.id');

createCctvProxy('/bandarlampung-stream', 'https://sliceseribuwajah.bandarlampungkota.go.id', {
  origin: 'https://seribuwajah.bandarlampungkota.go.id',
  referer: 'https://seribuwajah.bandarlampungkota.go.id/'
});

createCctvProxy('/ciamis-stream', 'https://ams.ciamiskab.go.id:5443');
createCctvProxy('/palembang-stream', 'https://stream.palembang.go.id');
createCctvProxy('/buleleng-stream', 'https://shinobi.bulelengkab.go.id');
createCctvProxy('/kebumen-stream', 'https://cctv.kebumenkab.go.id');
createCctvProxy('/surabaya-api', 'http://36.66.208.101:5000');
createCctvProxy('/banjar-stream', 'https://cctv.banjarkab.go.id');
createCctvProxy('/balangan-stream', 'https://cctv.balangankab.go.id/hls');
createCctvProxy('/kotabaru-stream', 'https://atcs.dishubkotabaru.id/live');
createCctvProxy('/tabalong-stream', 'https://cctv.tabalongkab.go.id', {
  pathRewrite: {
    '^/': '/api/stream/hls/'
  },
  origin: 'https://cctv.tabalongkab.go.id',
  referer: 'https://cctv.tabalongkab.go.id/',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  followRedirects: true
});
createCctvProxy('/tanahbumbu-stream', 'https://atcs.tanahbumbukab.go.id/hls');
createCctvProxy('/kutim-hls', 'https://cctv.kutaitimurkab.go.id/hls');
createCctvProxy('/tapin-stream', 'https://cctv.tapinkab.go.id');
createCctvProxy('/depok-stream', 'https://dishub.depok.go.id');
createCctvProxy('/sukabumikab-stream', 'https://cctv-dishub.sukabumikab.go.id');
createCctvProxy('/pekalongankab-stream', 'https://cctv.pekalongankab.go.id');

// Serve compiled static frontend assets in production mode
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Server] Express backend server is running on http://localhost:${PORT}`);
  });
}

export default app;
