// เปลี่ยนเลขเวอร์ชันทุกครั้งที่แก้ index.html เพื่อให้เครื่องโหลดไฟล์ใหม่
const CACHE = 'heart-destroyer-v2';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// เปิดจาก cache ก่อน (ออฟไลน์ได้) ถ้าไม่มีค่อยไปเน็ต
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
