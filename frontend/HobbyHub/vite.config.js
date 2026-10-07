import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createLogoPngBuffer() {
  const width = 64;
  const height = 64;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function calcCrc(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const combined = Buffer.concat([typeBuf, data]);
    const crc = calcCrc(combined);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([lenBuf, combined, crcBuf]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  const cx = 32;
  const cy = 32;
  const radius = 29;

  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        const isLeftBar = x >= 20 && x <= 25 && y >= 17 && y <= 47;
        const isRightBar = x >= 38 && x <= 43 && y >= 17 && y <= 47;
        const isCrossBar = x >= 20 && x <= 43 && y >= 29 && y <= 35;

        const edgeAlpha = dist > radius - 1 ? Math.floor(255 * (radius - dist + 1)) : 255;
        const alpha = Math.max(0, Math.min(255, edgeAlpha));

        if (isLeftBar || isRightBar || isCrossBar) {
          rawScanlines[offset++] = 255;
          rawScanlines[offset++] = 255;
          rawScanlines[offset++] = 255;
          rawScanlines[offset++] = alpha;
        } else {
          rawScanlines[offset++] = 255;
          rawScanlines[offset++] = 69;
          rawScanlines[offset++] = 0;
          rawScanlines[offset++] = alpha;
        }
      } else {
        rawScanlines[offset++] = 0;
        rawScanlines[offset++] = 0;
        rawScanlines[offset++] = 0;
        rawScanlines[offset++] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(rawScanlines);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

try {
  const publicDir = path.resolve(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicLogo = path.join(publicDir, 'logohub.png');
  const assetsLogo = path.resolve(__dirname, 'src/assets/logohub.png');
  const logoBuf = createLogoPngBuffer();

  if (!fs.existsSync(publicLogo)) {
    fs.writeFileSync(publicLogo, logoBuf);
  }
  if (!fs.existsSync(assetsLogo)) {
    fs.writeFileSync(assetsLogo, logoBuf);
  }
} catch (e) {
  console.warn('Logo generation note:', e.message);
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8080', changeOrigin: true },
      '/login': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});
