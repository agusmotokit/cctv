import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disable TLS verification for some regional ATCS domains (e.g. Malang Kota)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Gzip/Brotli compression for performance optimization
app.use(compression());

// Enable CORS for frontend development
app.use(cors());
app.use(express.json());

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

// REST API Endpoints
app.get('/api/cctvs', (req, res) => {
  res.json(cctvData);
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

// Proxy setups for different region stream sources
const createCctvProxy = (prefix, target, options = {}) => {
  app.use(prefix, createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false,
    on: {
      proxyReq: (proxyReq) => {
        if (options.origin) proxyReq.setHeader('Origin', options.origin);
        if (options.referer) proxyReq.setHeader('Referer', options.referer);
        if (options.userAgent) proxyReq.setHeader('User-Agent', options.userAgent);
        if (options.cookies) proxyReq.setHeader('Cookie', options.cookies);
      },
      proxyRes: (proxyRes) => {
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
