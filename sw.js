// เปลี่ยนเลขเวอร์ชันทุกครั้งที่แก้ไฟล์ เพื่อให้เครื่องล้าง cache เก่า
const CACHE = 'heart-destroyer-v7';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const AUDIO = ['./megalovania.mp3', './blaster.mp3', './bone.mp3'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      await c.addAll(CORE);
      await Promise.allSettled(AUDIO.map(u => c.add(u))); // เสียงโหลดไม่ได้ก็ไม่ให้ติดตั้งล้มเหลว
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ไฟล์เสียงต้องตอบแบบ Range (206) เมื่อเล่นจาก cache ไม่งั้น Chrome อาจเล่น/วนลูปไม่ได้
async function ranged(req, res) {
  const range = req.headers.get('range');
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(range);
  if (!m) return new Response(buf, { status: 200, headers: res.headers });
  const s = +m[1], e = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(s, e + 1), {
    status: 206,
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${s}-${e}/${buf.byteLength}`,
      'Content-Length': String(e - s + 1)
    }
  });
}

// หน้า HTML: ลองเน็ตก่อน (ได้ไฟล์ใหม่เสมอ) ถ้าออฟไลน์ค่อยใช้ cache | ไฟล์อื่น: cache ก่อน
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  e.respondWith(
    req.mode === 'navigate'
      ? fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
          .catch(() => caches.match(req).then(h => h || caches.match('./index.html')))
      : caches.match(req, { ignoreSearch: true }).then(h => h ? ranged(req, h) : fetch(req))
  );
});
