import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTargets = [
  '/api',
  '/gresik-api',
  '/bwi-hls',
  '/bjm-stream',
  '/pati-stream',
  '/grobogan-cradnu',
  '/grobogan-stream',
  '/kobar-stream',
  '/malang-stream',
  '/cirebon-stream',
  '/bandung-stream',
  '/kuningan-stream',
  '/jepara-lifemedia',
  '/jepara-stream-8083',
  '/jepara-stream-8084',
  '/singkawang-stream',
  '/tarakan-stream',
  '/purwakarta-stream',
  '/tuban-api',
  '/tuban-stream',
  '/bandarlampung-stream',
  '/ciamis-stream',
  '/palembang-stream',
  '/buleleng-stream',
  '/kebumen-stream',
  '/surabaya-api',
  '/depok-stream',
  '/sukabumikab-stream',
  '/pekalongankab-stream',
  '/bandung-pelindung-stream'
];

const proxyConfig: Record<string, ProxyOptions> = {};
proxyTargets.forEach(path => {
  proxyConfig[path] = {
    target: 'http://localhost:5000',
    changeOrigin: true,
    secure: false
  };
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: proxyConfig
  },
  optimizeDeps: {
    include: ['tslib']
  }
})


